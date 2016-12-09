"use strict";

let FFMetadata = require('ffmetadata');
let fs = require('fs');
let metadata = require('./metadata');

// modules.export = AudioFile;

let AudioFile = module.exports = function(filepath) {
    this.filepath = filepath;
    this.album = '';
    this.albumArtwork = '';
    this.metadata = new metadata();
};

//TODO convert m4a files to mp3
//http://superuser.com/questions/704493/ffmpeg-convert-m4a-files-to-mp3-without-significant-loss-of-information-quali

AudioFile.prototype.writeMetadata = function () {
    let jsonMetadata = this.getMetadata();

    if (!jsonMetadata) return false;

    // TODO download albumArtwork
    // console.log('albumArtworkURL: ', albumArtworkURL);
    console.log('want to write to ' + this.filepath);
    this.metadata.write(this.filepath);

    // fs.unlink(jsonPath);
};

AudioFile.prototype.getMetadata = function () {
    let filepath = this.filepath;

    let possibleJSONFilePath = filepath.substring(0, filepath.length - 3) + 'json';
    let metadataFile = this.metadata.getMetadataFromFile(possibleJSONFilePath);

    if (metadataFile) {
        return metadataFile;
    } else {
        return null;
    }
};