'use strict'
let JSONFile = require('jsonfile');
let FFMetadata = require("ffmetadata");

function AudioFile(path) {
    this.path = path;
}

let fn = AudioFile.prototype;

fn.writeMetadataFromJSONFile = function(jsonPath) {
    JSONFile.readFile(jsonPath, (err, obj) => {
        if (err) {
            console.error(err);
            return false;
        }
        let ffmpegFormattedObj = this.convertToFFMPEG(obj);
        this.setMetadata(ffmpegFormattedObj);
        return true;
    });
};

fn.convertToFFMPEG = function(json) {
    // TODO add function to download album artwork and attach it as an 'attachment' then delete it
    // http://stackoverflow.com/questions/12740659/downloading-images-with-node-js
    const PATH = 'C:/Users/CHergott/Downloads/_Chrome/';
    let albumArtwork = PATH + 'tmp.png';
    let ffmpeg = {
        title: json.title || json.songName || '',
        artist: json.author || json.artist || '',
        album: json.album || '',
        attachments: [albumArtwork]
    };
    console.log('convered to ffmpeg: ' + JSON.stringify(ffmpeg));
    return ffmpeg;
};

fn.isSupportedAudioFile = function(filename) {
    const REGEX_SUPPORTED_FILE_TYPES = /\.m((p3)|(4a))$/;
    if (REGEX_SUPPORTED_FILE_TYPES.test(file)) {
        return true;
    }
    return false;
};

fn.setPath = function(path) {
    this.path = path;
};


fn.setMetadata = function(metadata) {
    console.log('writing metadata: ' + JSON.stringify(metadata));
    console.log('this path: ', this.path);
    FFMetadata.write(this.path, metadata, function(err) {
        if (err) console.error("Error writing metadata", err);
        else console.log("Data written");
    });
};

module.exports = AudioFile;
