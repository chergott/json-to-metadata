'use strict'
let fs = require('fs');

let AudioFile = require('./audiofile');

const PATH = "C:/Users/CHergott/Google Drive/Music/Lute/";
//TODO dynamically set path
initialize();


function initialize() {
    // search directory for audio files
    fs.readdir(PATH, function(error, files) {
        if (error) return;
        // find all the files in the PATH i.e directory where downloads are found
        files.forEach(function(file) {
            console.log('Reading ' + file + '...');
            // check if the file is an audio file
            if (isSupportedAudioFile(file)) {
                // check if there's a matching json file
                let jsonFile = getMatchingJSONFile(file);
                if (jsonFile) {
                    // if so, write metadata to audio file
                    console.log('matching json file: ', jsonFile);
                    let audioFile = new AudioFile(PATH + file);
                    audioFile.writeMetadataFromJSONFile(jsonFile);
                }

            }
        });
    });
}

function isSupportedAudioFile(file) {
    const REGEX_SUPPORTED_FILE_TYPES = /\.m((p3)|(4a))$/;
    if (REGEX_SUPPORTED_FILE_TYPES.test(file)) {
        console.log(file + ' is a supported audio file!');
        return true;
    }
    console.log(file + ' is not a supported audio file');
    return false;
}

function getMatchingJSONFile(file) {
    let possibleJSONFile = PATH + file.substring(0, file.length - 3) + 'json';
    console.log('Checking if ' + possibleJSONFile + ' exists...');
    let hasMatch = fs.existsSync(possibleJSONFile);
    if (hasMatch) {
        let jsonFile = possibleJSONFile;
        console.log('Found a match! ' + jsonFile);
        return jsonFile;
    } else {
        console.log('No match found for ' + file);
        return null;
    }
}
