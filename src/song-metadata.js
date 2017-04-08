import fs from 'fs-extra';


import AudioFile from './audio-file';
import prompt from './utils/prompt';


let songMetadata = function () {
    this.audioFiles = [];
    this.number = 0;
    this.total = 0;
    this.menu();
};

let fn = songMetadata.prototype;

fn.menu = function () {

};

fn.scan = function (location) {
    let self = this;

    
};




fn.onFoundAudioFile = function (audioFile) {
    this.total++;
    this.audioFiles.push(audioFile);
    // log(`${this.total}.\t Finding metadata for ${audioFile.toString()}`);
};

fn.onHasMetadata = function () {
    this.number++;
};

fn.onHasInvalidAudioFileMetadata = function (audioFile) {
    this.printAudioFile(audioFile);
};

fn.onDiscoveredNewMetadata = function (audioFile) {
    this.printAudioFile(audioFile);
};

fn.onDiscoveredSameMetadata = function (audioFile) {
    // this.printAudioFile(audioFile);
};

/* 3. Finished */
fn.onFinish = function () {
    log.print('Finished', {
        color: 'cyan'
    });
};

fn.printAudioFile = function (audioFile, options) {
    let idString = '' + this.number + '. ';
    log(idString + audioFile.toString() + '\n', options);
};


function hasNewMetadata(audioFile) {
    return audioFile.hasNewMetadata ? true : false;
}