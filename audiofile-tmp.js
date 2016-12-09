"use strict";
let JSONFile = require('jsonfile');
let FFMetadata = require("ffmetadata");
let request = require('request');
let fs = require('fs');

module.exports = AudioFile;

function AudioFile(path) {
    this.path = path;
    this.album = '';
    this.albumArtwork = '';
}

let fn = AudioFile.prototype;

fn.getMetadata = function () {
    let path = this.path;
    let metadataFile = this.getMetadataFromFile(path);

    if (metadataFile) {
        return metadataFile;
    } else {
        return false;
    }
};

fn.getMetadataFromFile = function (file) {
    let possibleJSONFilePath = PATH + file.substring(0, file.length - 3) + 'json';
    console.log('Checking if ' + possibleJSONFilePath + ' exists...');
    let hasMatch = fs.existsSync(possibleJSONFilePath);
    if (hasMatch) {
        let jsonFile = possibleJSONFilePath;
        console.log('Found a match! ' + possibleJSONFilePath);
        return JSONFile.readFileSync(possibleJSONFilePath);
    } else {
        console.log('No match found for ' + file);
        return false;
    }
};

//TODO convert m4a files to mp3
//http://superuser.com/questions/704493/ffmpeg-convert-m4a-files-to-mp3-without-significant-loss-of-information-quali

fn.getObjFromJSONFile = function (jsonPath) {
    return 
};

fn.writeMetadata = function() {
    let metadata = this.getMetadata();
    let ffmpegMetadata = this.convertToFFMPEG(obj);
    let albumArtworkURL = obj.albumArtwork || obj.image || obj.albumCover || obj.cover || false;
    console.log('albumArtworkURL: ', albumArtworkURL);
    let options = {};
    if (albumArtworkURL) {
        let self = this;
        this.downloadAlbumArtwork(albumArtworkURL, () => {
            options.attachments = [this.albumArtwork];
            this.setMetadata(ffmpegMetadata, options);
        });
    } else {
        this.setMetadata(ffmpegMetadata, options);
    }
    fs.unlink(jsonPath);
    return true;
};

fn.convertToFFMPEG = function (json) {
    // http://stackoverflow.com/questions/12740659/downloading-images-with-node-js
    const PATH = 'C:/Users/CHergott/Downloads/_Chrome/';

    let ffmpeg = {
        title: json.title || json.songName || '',
        artist: json.author || json.artist || '',
        album: json.album || ''
    };
    this.album = ffmpeg.album;
    console.log('convered to ffmpeg: ' + JSON.stringify(ffmpeg));
    return ffmpeg;
};

fn.isSupportedAudioFile = function (filename) {
    const REGEX_SUPPORTED_FILE_TYPES = /\.m((p3)|(4a))$/;
    if (REGEX_SUPPORTED_FILE_TYPES.test(file)) {
        return true;
    }
    return false;
};

fn.setMetadata = function (metadata, options) {
    console.log('writing metadata: ' + JSON.stringify(metadata));
    console.log('writing options: ', JSON.stringify(options))
    console.log('this path: ', this.path);
    FFMetadata.write(this.path, metadata, options, function (err) {
        if (err) console.error("Error writing metadata", err);
        else {
            if (options.attachments) {
                // remove album artwork
                fs.unlink(options.attachments[0]);
            }
            console.log("Data written");
        }
    });
};

fn.downloadAlbumArtwork = function (url, callback) {
    let fileExtension = '.' + url.split('.').pop();
    console.log("attempting to download image from " + url);
    request.head(url, (err, res, body) => {
        // console.log('res: ', res);
        // console.log('content-type:', res.headers['content-type']);
        // console.log('content-length:', res.headers['content-length']);
        let albumArtwork = this.albumArtwork = this.album + fileExtension;
        request(url).pipe(fs.createWriteStream(albumArtwork)).on('close', callback);
    });
};