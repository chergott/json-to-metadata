"use strict";
let fs = require('fs');
let ffmetadata = require('ffmetadata');

let metadata = module.exports = function (obj) {
    this.metadata = obj;
};

metadata.prototype.read = function (filepath) {
    return new Promise(function (resolve, reject) {
        ffmetadata.read(filepath, function (err, data) {
            if (err) {
                console.error("Error reading metadata", err);
                reject();
            } else {
                let metadata = {
                    title: data.title,
                    artist: data.artist,
                    album: data.album,
                    albumArtwork: data.albumArtwork,
                    genre: data.genre
                };
                resolve(metadata);
            }
        });

    });
};

metadata.prototype.write = function (filepath) {
    let metadata = this.metadata = toFFMPEG(this.metadata);
    let hasArtwork = metadata.albumArtworkPath ? true : false;
    let options = {};

    if (hasArtwork) {
        options.attachments = [metadata.albumArtwork];
    }

    ffmetadata.write(filepath, metadata, options, function (err) {
        if (err) console.error("Error writing metadata", err);
        else {
            if (options.attachments) {
                // remove album artwork
                fs.unlink(options.attachments[0]);
            }
            console.log("Metadata written to  ", filepath);
        }
    });
};

function toFFMPEG(metadata) {
    // http://stackoverflow.com/questions/12740659/downloading-images-with-node-js

    let ffmpeg = {
        title: metadata.title || metadata.songName || '',
        artist: metadata.artist || metadata.author || '',
        album: metadata.album || '',
        albumArtwork: metadata.albumArtwork || metadata.albumArtworkURL || ''
    };

    console.log('converted to ffmpeg: ' + JSON.stringify(ffmpeg));
    return ffmpeg;
};