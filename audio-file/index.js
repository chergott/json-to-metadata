"use strict";
let fs = require('fs');
let request = require('request');
let FFMetadata = require('ffmetadata');

let JSONFile = require('jsonfile');
let Metadata = require('./metadata');
let parseFilename = require('./parse-filename');

let AudioFile = module.exports = function (filepath) {
    this.filepath = filepath;

    let parsedData = parseFilename(filepath);
    this.filename = parsedData.filename;
    this.artist = parsedData.artist;
    this.title = parsedData.title;
    this.extension = parsedData.extension;
};

AudioFile.prototype.writeMetadata = function () {
    let self = this;
    self.getMetadataFromFile(self.filepath).then((currentMetadata) => {
        // console.log('- Metadata on file: \n', currentMetadata);        
        self.artist = currentMetadata.artist || self.artist || null;
        self.title = currentMetadata.title || self.title || null;
        self.album = currentMetadata.album || self.album || null;

        let hasValidMetadata = (self.artist && self.title && self.album);
        if (hasValidMetadata) {
            // console.log('- Not writing to ', self.filename, ' since the file has valid metadata');
        } else {
            console.log('writing metadata to ', self.filename);
            this.getMetadata().then((metadata) => {
                console.log('* Metadata found for ', self.filename, ': \n', metadata);
                if (!metadata) return false;
                metadata = new Metadata(metadata);
                metadata.write(this.filepath);
            });
        }
    });
    // fs.unlink(jsonPath);
};

AudioFile.prototype.getMetadata = function () {
    let self = this;
    let filepath = this.filepath;

    let possibleLocalJSONFilePath = filepath.substring(0, filepath.length - 3) + 'json';
    let localMetadata = this.getMetadataFromJSONFile(possibleLocalJSONFilePath);

    return new Promise(function (resolve, reject) {
        // Local JSON File
        if (localMetadata) {
            resolve(localMetadata);
        } else {
            // Spotify API
            self.getMetadataFromSpotify().then(spotifyMetadata => {
                if (spotifyMetadata) {
                    resolve(spotifyMetadata);
                } else {
                    reject(spotifyMetadata);
                }
            });
        }
    });
};

AudioFile.prototype.getMetadataFromFile = function (filepath) {
    let metadata = new Metadata();
    return new Promise(function (resolve, reject) {
        resolve(metadata.read(filepath));
    });
};

AudioFile.prototype.getMetadataFromJSONFile = function (filepath) {
    let hasMatch = fs.existsSync(filepath);
    if (!hasMatch) return false;

    // console.log('Found JSON file: ' + filepath);

    let metadata = JSONFile.readFileSync(filepath);
    return metadata;
};

AudioFile.prototype.getMetadataFromSpotify = function () {
    let self = this;
    let query = encodeURI(this.title);
    let type = 'track';
    let limit = '10';
    let queryParams = '?q=' + query + '&type=' + type + '&limit=' + limit;
    let spotifyURL = 'https://api.spotify.com/v1/search' + queryParams;
    return new Promise(function (resolve, reject) {
        request(spotifyURL, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let json = JSON.parse(body);
                let metadata = self.extractMetadata(json);
                resolve(metadata);
            } else {
                resolve(null);
            }
        });
    });


};

AudioFile.prototype.extractMetadata = function (obj) {
    let fileTitle = this.title.toUpperCase();
    let fileArtist = this.artist ? this.artist.toUpperCase() : null;

    let isSpotifyAPI = obj.hasOwnProperty('tracks');

    if (isSpotifyAPI) {
        let tracks = obj.tracks.items;
        for (let index in tracks) {

            let track = tracks[index];
            let artist = track.artists[0].name;
            let album = track.album.name;
            let title = track.name;
            let albumArtworkURL = track.album.images[0].url;
            let possibleMetadata = {
                title,
                artist,
                album,
                albumArtworkURL
            };
            if (fileArtist && fileArtist.includes(artist.toUpperCase())) {
                return possibleMetadata;
            } else if (!fileArtist && fileTitle === title.toUpperCase()) {
                return possibleMetadata;
            }
        }

        console.log('! Could not find Spotify metadata for ', this.filename);
    }
};

function encodeURI(uri) {
    let encoded = uri;
    // White space
    encoded = encoded.replace(/\s/g, '+');
    // & => %26
    encoded = encoded.replace(/&/g, '%26');
    // ' => %27
    encoded = encoded.replace(/'/g, '%27');
    // ( => %28
    encoded = encoded.replace(/\(/g, '%28');
    // ) => %29
    encoded = encoded.replace(/\)/g, '%29');
    return encoded;
}