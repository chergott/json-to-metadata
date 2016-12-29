import fs from 'fs';
import ffmetadata from 'ffmetadata';
import request from 'request';
import RSVP from 'rsvp';

import ffmpeg from './ffmpeg';
import json from './json-file';
import spotify from './spotify-api';

module.exports = {
    read,
    write,
    getFromJSONFile,
    getFromSpotify
};


function read(filepath) {
    return new Promise(function (resolve, reject) {
        ffmetadata.read(filepath, function (error, metadata) {
            if (err) {
                reject(error);
            } else {
                resolve(metadata);
            }
        });
    });
}

function write(filepath, metadata) {
    metadata = ffmpeg.toFFMPEG(metadata);
    let hasArtwork = metadata.albumArtworkPath ? true : false;
    let options = {};

    if (hasArtwork) {
        options.attachments = [metadata.albumArtwork];
    }

    ffmetadata.write(filepath, metadata, options, function (err) {
        if (err) console.error("Error writing metadata", err);
        else {
            if (hasArtwork) {
                // remove album artwork image
                fs.unlink(options.attachments[0]);
            }
            // console.log('wrote ', metadata, ' to ', filepath);
        }
    });
}

function getFromJSONFile(filepath) {
    let jsonMetadata = json.readFileSync(filepath);
    if (jsonMetadata) return ffmpeg.toFFMPEG(jsonMetadata);
    return false;
}

function getFromSpotify(metadata = {}) {
    return spotify.search(metadata)
        .then((spotifyMetadata) => {
            if (spotifyMetadata) {
                return ffmpeg.toFFMPEG(spotifyMetadata);
            }
            // console.log(metadata.filename, ': could not find matching metadata on Spotify');
            return false;
        });
}