import ffmetadata from 'ffmetadata';
import Table from 'cli-table';
import prettyjson from 'prettyjson';
import path from 'path';
import parseFilename from './parse-filename';
import ffmpeg from './ffmpeg';
import spotify from './spotify-api';

let AudioFile = module.exports = function (filepath) {
    this.filepath = filepath;
    this.filename = path.basename(filepath);

    let parsedFilenameMetadata = parseFilename(filepath);
    this.stagedMetadata = parsedFilenameMetadata;
    this.metadata = {};
};

let proto = AudioFile.prototype;

proto.getMetadata = function () {
    return this.metadata;
};

proto.readMetadata = function () {
    let self = this;
    let filepath = this.filepath;
    return new Promise(function (resolve, reject) {
        ffmetadata.read(filepath, function (error, localMetadata) {
            if (error) reject(error);
            // self.setCurrentMetadata(localMetadata);
            // resolve(self.getCurrentMetadata());
            // console.log('local: ', localMetadata);
            self.metadata = localMetadata;
            resolve(localMetadata);
        });
    });
};

proto.findMetadata = function () {
    let self = this;
    return spotify(this.stagedMetadata)
        .then(metadata => {
            metadata = ffmpeg.toFFMPEG(metadata);
            self.stageMetadata(metadata);
            return metadata;
        });
};


proto.writeMetadata = function () {
    let filepath = this.filepath;
    let self = this;

    return new Promise(function (resolve, reject) {
        let hasNewValue = self.compareMetadata().hasNewValue;
        if (hasNewValue) {

            let error = false;
            // ffmetadata.write(filepath, this.metadata, {}, function (error) {
            if (error) {
                // console.log(this.metadata);
                console.log('error when writing to ', filepath, 'ERROR: ', error);
                reject(error);
            } else {
                // console.log('wrote metadata to', filepath);
                self.metadata = Object.assign(self.metadata, ffmpeg.toFFMPEG(self.stagedMetadata));
                resolve(self.metadata);
            }
            // });
        } else {

            console.log('there is no new metadata to write for ', filepath);
            resolve();
        }
    });
    // console.log('wrote')
};

proto.stageMetadata = function (metadata) {
    // console.log('orig: ', this.metadata);
    // console.log('metadata passed: ', metadata);
    for (let property in metadata) {
        let isNewProperty = !this.metadata.hasOwnProperty(property);

        if (isNewProperty) {
            // console.log('Adding ' + property + ': ', metadata[property]);
            this.stagedMetadata[property] = metadata[property];
        } else {
            let isNewValue = this.metadata[property] !== metadata[property];
            if (isNewValue) {
                // console.log('Replacing ' + property + ' from '+ this.metadata[property] + ' to ' + metadata[property]);
                this.stagedMetadata[property] = metadata[property];
            } else {
                // console.log('Found matching value ' + metadata[property] + ' for ' + property);
            }
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

    let hasNewValue = this.compareMetadata().hasNewValue;

    if (hasNewValue) {
        metadataTable = new Table({
            head: ['Original', 'Staged'],
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
            head: ['Original'],
            colWidths: [50],
            style: {
                head: ['white'],
                border: ['gray']
            }
        });

        metadataTable.push([originalTable]);
    }

    return header + '\n' + metadataTable.toString();
};

proto.compareMetadata = function () {
    let original = this.metadata;
    let staged = this.stagedMetadata;
    let additions = [];
    let differences = [];
    let hasNewValue = false;

    for (let property in staged) {
        let obj = {};
        let originalProperty = original[property];
        let stagedProperty = staged[property];
        if (!originalProperty) {
            obj[property] = {
                staged: stagedProperty
            };
            hasNewValue = true;
            additions.push(obj);

        } else if (originalProperty !== stagedProperty) {
            obj[property] = {
                original: originalProperty,
                staged: stagedProperty
            };
            hasNewValue = true;
            differences.push(obj);
        } else {
            delete this.stagedMetadata[property];
        }
    }
    return {
        hasNewValue,
        additions,
        differences
    };
};