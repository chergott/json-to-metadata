"use strict";

// let fs = require('fs');
let fs = require('fs-extra');
let path = require('path');
let AudioFile = require('./audio-file');

// const PATH = "C:/Users/conno/Downloads";

//TODO dynamically set path

(function () {
    main();
    // scanItunesLibrary();
})();

function main() {
    const PATH = "C:/Users/CHergott/Downloads/test";
    let files = fs.walkSync(PATH);
    analyzeFiles(files);
}

function scanItunesLibrary() {
    const ITUNES_LIBRARY_PATH = "M:/Audio/Music";
    let files = fs.walkSync(ITUNES_LIBRARY_PATH);
    analyzeFiles(files);
}

function analyzeFiles(files) {

    files.forEach(function (filepath) {
        if (isAudioFile(filepath)) {
            console.log('Checking audio file: ', filepath);
            let audioFile = new AudioFile(filepath);
            audioFile.writeMetadata();
        }
    });
}

function isAudioFile(file) {
    const REGEX_AUDIO_FILE_TYPES = /\.m((p3)|(4a))$/;
    let isAudioFile = REGEX_AUDIO_FILE_TYPES.test(file);

    if (isAudioFile) return true;

    // console.log(file + ' is not an audio file');
    return false;
}