"use strict";

let request = require('request');
let fs = require('fs');

// module.exports = albumArtwork;

function albumArtwork(metadata) {
    this.album = metadata.album;
    this.albumURL = metadata.albumArtworkURL;
}

let fn = albumArtwork.prototype;

fn.downloadAlbumArtwork = function (url, callback) {
    let fileExtension = '.' + url.split('.').pop();
    console.log("attempting to download image from " + url);
    request.head(url, (err, res, body) => {
        let albumArtwork = this.albumArtwork = this.album + fileExtension;
        request(url).pipe(fs.createWriteStream(albumArtwork)).on('close', callback);
    });
};