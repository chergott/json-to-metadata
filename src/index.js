#!/usr/bin/env node
import fs from 'fs-extra';
import os from 'os';
import clear from 'clear';

import AudioFile from './audio-file';
import prompt from './utils/prompt';
import log from './utils/log';

(function () {
    init();
})();

function init() {
    // let songMetadata = new SongMetadata();
    clear();
    log('Lute', {
        type: 'heading',
        color: 'cyan'
    });
    menu();
}

function menu() {
    prompt('list', 'Where are your music files located?', ['Auto', 'iTunes', 'Custom'])
        .then(location => {

            switch (location) {

                case 'Auto':
                    prompt('confirm', 'Are you sure? This will scan almost every file on your computer and could take a long time.')
                        .then(confirmation => {
                            if (confirmation) {
                                let homeDirectory = os.homedir();
                                scanForAudioFiles(homeDirectory);
                            } else {
                                menu();
                                return;
                            }
                        });
                    break;

                case 'iTunes':
                    let iTunesDirectory = os.homedir() + '\\Music\\iTunes\\iTunes Media';
                    scanForAudioFiles(iTunesDirectory);
                    break;

                case 'Custom':
                    let defaultDirectory = os.homedir() + '\\Downloads';
                    prompt('input', 'What directory would you like to scan?', defaultDirectory)
                        .then(customDirectory => {
                            scanForAudioFiles(customDirectory);
                        });
                    break;
            }
        });
}

function scanForAudioFiles(directory) {

    let audioFilePaths = fs.walkSync(directory).filter(filepath => {
        return isAudioFile(filepath);
    });

    if (audioFilePaths.length) {
        cleanAudioFiles(audioFilePaths);
    } else {
        log('Did not find any audio files in ' + directory, {
            color: 'blue'
        });
    }

}

function cleanAudioFiles(audioFilePaths) {
    let audioFile = new AudioFile(audioFilePaths.shift());
    audioFile.clean()
        .then(() => {
            if (audioFilePaths.length)
                cleanAudioFiles(audioFilePaths);
        }).catch(() => {
            if (audioFilePaths.length)
                cleanAudioFiles(audioFilePaths);
        });
}

function isAudioFile(file) {
    const REGEX_AUDIO_FILE_TYPES = /\.m[p3|4a]+$/;
    return REGEX_AUDIO_FILE_TYPES.test(file);
}