"use strict";
let fs = require('fs');
let FFMetadata = require('ffmetadata');
let JSONFile = require('jsonfile');
let albumArtwork = require('./album-artwork');

let metadata = module.exports = function() {
    this.metadata = null;
}

let fn = metadata.prototype;

fn.getMetadataFromFile = function (filepath) {

    let hasMatch = fs.existsSync(filepath);
    if (hasMatch) {
        console.log('Found JSON file: ' + filepath);
        this.metadata = JSONFile.readFileSync(filepath);
    
        return this.metadata;

    } else {
        this.metadata = null;
        return this.metadata;
    }
};

fn.write = function(filepath) {
    let metadata = this.metadata = toFFMPEG(this.metadata);
    let options = {};
    let hasArtwork = metadata.albumArtwork ? true : false;

    if (hasArtwork) {
        options.attachments = [metadata.albumArtwork];
    }
    console.log('filepath: ', filepath);
    FFMetadata.write(filepath, metadata, options, function(err) {
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

function toFFMPEG(metadata) {
    // http://stackoverflow.com/questions/12740659/downloading-images-with-node-js

    let ffmpeg = {
        title: metadata.title || metadata.songName || '',
        artist: metadata.author || metadata.artist || '',
        album: metadata.album || ''
    };

    console.log('convered to ffmpeg: ' + JSON.stringify(ffmpeg));
    return ffmpeg;
};