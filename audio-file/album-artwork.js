"use strict";

module.exports = albumArtwork;

function albumArtwork(metadata) {
    this.album = metadata.album;
    this.albumURL = metadata.albumArtworkURL;
}

let fn = albumArtwork.prototype;

fn.downloadArtwork = function(url){

};