"use strict";

let fs = require('fs');
let AudioFile = require('./audio-file');

const PATH = "C:/Users/CHergott/Google Drive/Music/Lute/";
//TODO dynamically set path

(function () {
    let files = fs.readdirSync(PATH);

    files.forEach(function (filename) {

        if (isAudioFile(filename)) {
            let audioFile = new AudioFile(PATH + filename);
            audioFile.writeMetadata();
        }
        //TODO call external api to possibly get metadata
    });
})();

function isAudioFile(file) {
    const REGEX_AUDIO_FILE_TYPES = /\.m((p3)|(4a))$/;
    let isAudioFile = REGEX_AUDIO_FILE_TYPES.test(file);
    if (isAudioFile) {
        console.log(file + ' is a supported audio file!');
        return true;
    }
    console.log(file + ' is not a supported audio file');
    return false;
}