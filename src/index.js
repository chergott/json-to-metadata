#!/usr/bin/env node

import fs from 'fs-extra';
import os from 'os';
import clear from 'clear';
import jsonfile from 'jsonfile';
import path from 'path';

import AudioFile from './audio-file';
import prompt from './utils/prompt';
import log from './utils/log';

let Index = function () {
    this.settings = jsonfile.readFileSync(__dirname + '/settings.json');
    this.scanLocation = null;
    this.iTunesDirectory = this.settings.itunes_directory || os.homedir() + '\\Music\\iTunes';
    this.saveDirectory = this.settings.save_directory;
    this.init();
};

let proto = Index.prototype;

proto.init = function () {
    clear();
    log('Lute', {
        type: 'heading',
        color: 'cyan'
    });
    this.menu();
};


proto.menu = function () {
    prompt('list', 'Where are your music files located?', ['Current Directory', 'iTunes', 'Custom'])
        .then(location => {
            this.scanLocation = location;
            switch (location) {
                case 'Current Directory':
                    this.scanForAudioFiles(process.cwd());
                    break;
                case 'iTunes':
                    this.scanForAudioFiles(this.iTunesDirectory);
                    break;

                case 'Custom':
                    let defaultDirectory = os.homedir() + '\\Downloads';
                    prompt('input', 'What directory would you like to scan?', defaultDirectory)
                        .then(customDirectory => {
                            this.scanForAudioFiles(customDirectory);
                        });
                    break;
            }
        });
};

proto.scanForAudioFiles = function (directory) {
    let directoryExists = fs.existsSync(directory);
    if (!directoryExists) {
        log('Directory ' + directory + ' does not exist. Try again', {
            color: 'red'
        });
        this.menu();
        return;
    }
    let audioFilePaths = fs.walkSync(directory).filter(filepath => {
        return isAudioFile(filepath);
    });
    if (audioFilePaths.length) {
        this.cleanAudioFiles(audioFilePaths);
    } else {
        log('Did not find any audio files in ' + directory, {
            color: 'blue'
        });
    }
};

proto.cleanAudioFiles = function (audioFilePaths) {
    let audioFile = new AudioFile(audioFilePaths.shift());
    let shouldMoveAudioFile = !!(this.saveDirectory) && /custom/gi.test(this.scanLocation);
    // Recursively iterate through audio file path array
    audioFile.clean()
        .then(() => {
            if (shouldMoveAudioFile) {
                this.moveFileToSaveDirectory(audioFile.filepath);
            }
            if (audioFilePaths.length) {
                this.cleanAudioFiles(audioFilePaths);
            }
        }).catch(() => {
            if (audioFilePaths.length) {
                this.cleanAudioFiles(audioFilePaths);
            }
        });
};

proto.moveFileToSaveDirectory = function (oldFilepath, callback) {
    let hasSaveDirectory = !!(this.saveDirectory);
    if (!hasSaveDirectory) {
        log('Save directory is not valid. Go to settings to set a save directory.', {
            color: 'red'
        });
        return;
    }
    let filename = path.basename(oldFilepath);
    let newFilepath = this.saveDirectory + '/' + filename;

    fs.move(oldFilepath, newFilepath, function (error) {
        if (error) {
            log(error, {
                color: 'red'
            });
        }
        log('Moving ' + oldFilepath + ' to ' + newFilepath);
    });
};

function isAudioFile(file) {
    const REGEX_AUDIO_FILE_TYPES = /\.m(p3|4a)+$/;
    return REGEX_AUDIO_FILE_TYPES.test(file);
}

(function () {
    new Index();
})();