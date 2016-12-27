import AudioFile from './audio-file';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import clear from 'clear';
import inquirer from 'inquirer';
import log from './log';

/* CONDITION FOR FILE TO BE MODIFIED */
/* Default: missing the "album" */
function isMissingMetadata(originalMetadata) {
    return true; // can switch to true to always overwrite audio files
    return !originalMetadata.album;
}

let songMetadata = function () {
    this.init();
    this.audioFiles = [];
    this.unmodifiedAudioFiles = [];
    this.modifiedAudioFiles = [];
    this.errorAudioFiles = [];
    this.count = 0;
    this.total = 0;
};

let fn = songMetadata.prototype;

fn.init = function () {
    clear();
    let self = this;

    log('Song Metadata', {
        type: 'h1',
        color: 'blue'
    });

    const OPTIONS = [{
        type: 'list',
        name: 'option',
        message: 'Where are your music files located?',
        choices: ['Auto', 'iTunes', 'Custom'],
        filter: function (val) {
            return val.toLowerCase();
        }
    }];
    inquirer.prompt(OPTIONS).then((selection) => {
        self.main(selection.option);
    });
};

fn.main = function (selection) {
    switch (selection) {
        case 'auto':
            this.searchHomeDirectory();
            break;
        case 'itunes':
            this.searchITunesLibraryDirectory();
            break;
        case 'custom':
            this.searchCustomDirectory();
            break;
    }
};

/* 1. Home Directory */
fn.searchHomeDirectory = function () {
    let self = this;
    const CONFIRMATION_QUESTION = {
        type: 'list',
        name: 'confirmation',
        message: 'Are you sure? This will scan almost every file on your computer and will take a long time.',
        choices: ['Yes', 'No'],
        filter: function (val) {
            return val.toLowerCase();
        }
    };
    inquirer.prompt(CONFIRMATION_QUESTION).then(function (answer) {
        let isConfirmed = answer.confirmation === 'yes';
        if (isConfirmed) self.walkDirectoryForAudioFiles(os.homedir());
        else self.init();
    });
};

/* 2. iTunes Library Directory */
fn.searchITunesLibraryDirectory = function () {
    let directory = os.homedir() + '\\Music\\iTunes\\iTunes Media';
    this.walkDirectoryForAudioFiles(directory);
};

/* 3. Custom Directory */
fn.searchCustomDirectory = function () {
    let self = this;
    const CUSTOM_DIRECTORY_QUESTION = {
        type: 'input',
        name: 'custom_directory',
        message: 'What directory would you like to scan?',
        default: function () {
            return os.homedir() + '\\Downloads';
        }
    };
    inquirer.prompt(CUSTOM_DIRECTORY_QUESTION).then(function (answer) {
        self.walkDirectoryForAudioFiles(answer.custom_directory);
    });
};


fn.walkDirectoryForAudioFiles = function (directory) {
    log(`Finding audio files in ${directory}...`);
    let self = this;
    let count = 0;
    let totalAudioFiles = 0;

    fs.walk(directory)
        .on('data', (file) => {
            let filepath = file.path;
            if (!isAudioFile(filepath)) return;

            let audioFile = new AudioFile(filepath);
            self.audioFiles.push(filepath);

            audioFile.getCurrentMetadata()
                .then((originalMetadata) => {

                    if (isMissingMetadata(originalMetadata)) {

                        audioFile.getExternalMetadata()
                            .then((externalMetadata) => {

                                audioFile.writeMetadata(externalMetadata)
                                    .then(self.addAudioFile(audioFile, 'modified'));

                            }).catch(function (e) {

                                self.addAudioFile(audioFile, 'error');
                            });
                    } else {
                        self.addAudioFile(audioFile, 'unmodified');
                    }

                });
        })
        .on('end', function () {
            self.total = self.audioFiles.length;
        });
};

fn.addAudioFile = function (audioFile, status) {
    this.count++;
    let audioFileString = `\n${this.count}. ${audioFile.filename}`;
    let logOptions = {
        color: 'white'
    };

    switch (status) {
        case 'modified':
            this.modifiedAudioFiles.push(audioFileString);
            logOptions = {
                color: 'white',
                background: 'blue'
            };
            break;
        case 'unmodified':
            this.unmodifiedAudioFiles.push(audioFileString);
            break;
        default:
            this.errorAudioFiles.push(audioFileString);
            break;
    }

    log(`\n${this.count}. ${audioFile.filename}`, logOptions);

    // Print Original Metadata
    log(audioFile.originalMetadata, {
        color: 'gray'
    });

    // Print Updated Metadata
    if (status === 'modified') {
        log(audioFile.updatedMetadata, {
            color: 'cyan'
        });
    }

    // Print Error Message 
    if (status === 'error') {
        log(audioFile.errorMessage, {
            color: 'red'
        });
    }

    if (this.total === this.count) {
        this.end();
    }
};

fn.end = function () {
    this.printSummary();
};

fn.printSummary = function () {
    // Modified Audio Files
    if (this.modifiedAudioFiles.length) {
        log('Modified', {
            type: 'h1',
            color: 'blue'
        });
        log(this.modifiedAudioFiles.join('\n'));
    }

    // Unmodified Audio Files
    if (this.unmodifiedAudioFiles.length) {
        // log('Unmodified', {
        //     type: 'h2',
        //     color: 'magenta'
        // });
        // log(this.unmodifiedAudioFiles.join('\n'));
    }

    // Error Audio Files
    if (this.errorAudioFiles.length) {
        log('Errors', {
            type: 'h2',
            color: 'red'
        });
        log(this.errorAudioFiles.join('\n'));
    }
};



function isAudioFile(file) {
    const REGEX_AUDIO_FILE_TYPES = /\.m((p3)|(4a))$/;
    let isAudioFile = REGEX_AUDIO_FILE_TYPES.test(file);

    if (isAudioFile) return true;

    // console.log(file + ' is not an audio file');
    return false;
}

new songMetadata();