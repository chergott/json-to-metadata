import ffmetadata from 'ffmetadata';
import fs from 'fs-extra';
import Table from 'cli-table';
import prettyjson from 'prettyjson';
import path from 'path';
import rename from 'rename';
import parseFilename from './parse-filename';
import ffmpeg from './ffmpeg';
import spotify from './spotify';
import log from '../utils/log';

let AudioFile = module.exports = function (filepath) {
    this.filepath = filepath;
    this.filename = path.basename(filepath);
    this.stagedMetadata = {};
    this.metadata = {};
};

let proto = AudioFile.prototype;

proto.clean = function () {
    let self = this;
    let filepath = this.filepath;
    let promise = new Promise(function (resolve, reject) {
        self.readMetadata()
            .then(readMetadata => {
                self.cleanFileExtension();
                self.removeUnnecessaryMetadata();
                if (self.hasAllMetadata()) {
                    // log(self.toString() + '\n');
                    resolve();
                    return;
                } else {
                    self.findMetadata()
                        .then(spotifyMetadata => {
                            let foundMetadata = ffmpeg.toFFMPEG(spotifyMetadata);
                            self.stageMetadata(foundMetadata, {
                                newProperty: true,
                                newValue: true
                            });
                            log(self.toString() + '\n');
                            self.writeMetadata()
                                .then(resolve())
                                .catch(() => {
                                    reject();
                                });
                        })
                        .catch((error) => {
                            log('Could not find metadata for ' + self.filename + '\nError: ' + JSON.stringify(error), {
                                color: 'green'
                            });
                            reject();
                        });
                }
            })
            .catch(() => {
                reject();
            });
    });
    return promise;
};

proto.readMetadata = function () {
    let self = this;
    let filepath = this.filepath;
    let promise = new Promise(function (resolve, reject) {
        ffmetadata.read(filepath, function (error, readMetadata) {
            if (error) {
                log('Could not read ' + filepath + '\n this error could occur because\n\t1. Corrupt audio file\n\t2. ffmpeg is not setup on your computer.\n\  t1. Download FFMPEG from their website.\n\t  2. Add FFMPEG/bin as a PATH variable.', {
                    color: 'red'
                });
                reject();
            } else {
                Object.assign(self.metadata, readMetadata);
                resolve(readMetadata);
            }
        });
    });
    return promise;
};

proto.findMetadata = function () {
    let parsedFilenameMetadata = parseFilename(this.filepath);
    return spotify({
        title: this.metadata.title || this.stagedMetadata.title || parsedFilenameMetadata.title,
        artist: this.metadata.artist || this.stagedMetadata.artist || parsedFilenameMetadata.artist,
        album: this.metadata.album || this.stagedMetadata.album
    });
};

proto.writeMetadata = function () {
    let filepath = this.filepath;
    let self = this;
    let promise = new Promise(function (resolve, reject) {
        if (self.hasStagedMetadata()) {
            let error = false;
            ffmetadata.write(filepath, self.stagedMetadata, {}, function (error) {
                if (error) {
                    log('Could not write metadata to ' + self.filename + '\n\t- may be a corrupt file', {
                        color: 'red'
                    });
                    reject();
                } else {
                    // log('Successfully wrote staged metadata to ' + filepath, {
                    //     color: 'cyan'
                    // });
                    Object.assign(self.metadata, self.stagedMetadata);
                    resolve();
                }
            });
        }
    });
    return promise;
};

proto.stageMetadata = function (newMetadata, options) {
    let {
        newProperty = true,
            newValue = true
    } = options;

    for (let property in newMetadata) {
        let isNewProperty = newProperty && !this.metadata.hasOwnProperty(property);
        let isNewValue = newValue && (this.metadata[property] !== newMetadata[property]);
        if (isNewProperty || isNewValue) {
            this.stagedMetadata[property] = newMetadata[property];
        }
    }
};

proto.hasStagedMetadata = function () {
    for (let property in this.stagedMetadata) {
        if (this.stagedMetadata.hasOwnProperty(property)) {
            return true;
        }
    }
};

proto.hasAllMetadata = function () {
    const METADATA_PROPERTIES = ['artist', 'title', 'album_artist', 'album', 'date', 'disc', 'genre', 'copyright', 'track'];
    for (let index in METADATA_PROPERTIES) {
        let property = METADATA_PROPERTIES[index];
        if (!this.metadata.hasOwnProperty(property)) {
            return false;
        }
    }
    return true;
};

proto.cleanFileExtension = function () {
    let self = this;
    let majorBrand = this.metadata.major_brand;
    let fileExtension = path.extname(self.filepath);
    if (majorBrand === 'mp42' && fileExtension === '.mp3') {
        let m4aFilepath = rename(self.filepath, {
            extname: ".m4a"
        });
        fs.rename(self.filepath, m4aFilepath, function (err) {
            self.filepath = m4aFilepath;
            self.filename = path.basename(m4aFilepath);
        });
    }
};

proto.removeUnnecessaryMetadata = function () {
    for (let prop in this.metadata) {
        let hasMusicBrainz = /musicbrainz/gi.test(prop);
        if (hasMusicBrainz) {
            delete this.metadata[prop];
        }
    }
};

proto.toString = function () {
    let header = this.filename;
    let metadataTable;

    const JSON_OPTIONS = {
        noColor: true
    };

    let originalTable = prettyjson.render(this.metadata, JSON_OPTIONS);

    if (this.hasStagedMetadata()) {
        metadataTable = new Table({
            head: [header, 'Staged'],
            colWidths: [50, 50],
            style: {
                head: ['white'],
                border: ['cyan']
            }
        });

        let stagedTable = prettyjson.render(this.stagedMetadata, JSON_OPTIONS);
        metadataTable.push([originalTable, stagedTable]);

    } else {
        metadataTable = new Table({
            head: [header],
            colWidths: [50],
            style: {
                head: ['white'],
                border: ['gray']
            }
        });

        metadataTable.push([originalTable]);
    }

    return metadataTable.toString();
};