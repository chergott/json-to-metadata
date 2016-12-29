import ffmetadata from 'ffmetadata';
import metadata from '../metadata';
import parseFilename from './parse-filename';

let AudioFile = module.exports = function (filepath) {
    let parsedFilenameMetadata = parseFilename(filepath);
    this.filepath = filepath;
    this.filename = parsedFilenameMetadata.filename;
    this.originalMetadata = {};
    this.currentMetadata = {};
    this.setCurrentMetadata(parsedFilenameMetadata);
    this.responseMessage = '';
};

let audioFile = AudioFile.prototype;

audioFile.readMetadata = function () {
    let self = this;
    let filepath = this.filepath;
    return new Promise(function (resolve, reject) {
        ffmetadata.read(filepath, function (error, localMetadata) {
            if (error) reject(this);
            self.originalMetadata = localMetadata;
            self.setCurrentMetadata(localMetadata);
            resolve(self.currentMetadata);
        });
    });
};

audioFile.writeMetadata = function (newMetadata) {
    let self = this;
    return new Promise(function (resolve, reject) {
        resolve(metadata.write(self.filepath, newMetadata));
    });
};

audioFile.getMetadata = function () {
    let self = this;
    return self.readMetadata()
        .then((internalMetadata) => {
            // Local JSON File
            let filepath = self.filepath;
            let possibleLocalJSONFilePath = filepath.substring(0, filepath.length - 3) + 'json';
            let localMetadata = metadata.getFromJSONFile(possibleLocalJSONFilePath);
            if (localMetadata) {
                self.setCurrentMetadata(localMetadata);
                return self.currentMetadata;
            }
            //Spotify API
            return metadata.getFromSpotify(self.currentMetadata)
                .then(spotifyMetadata => {
                    if (spotifyMetadata) {
                        self.setCurrentMetadata(spotifyMetadata);
                        return self.currentMetadata;
                    }
                    return false;
                });
        });
};

audioFile.getCurrentMetadata = function () {
    return this.currentMetadata;
};

audioFile.setCurrentMetadata = function (newMetadata, isOverride = false) {
    // console.log('- Old CM: ', this.currentMetadata);
    for (let property in newMetadata) {
        let hasValue = !!(this.currentMetadata[property]);
        if (isOverride || !hasValue) {
            this.currentMetadata[property] = newMetadata[property];
        }
    }
    // console.log('- New CM: ', this.currentMetadata);
};



audioFile.toString = function () {
    return this.filename;
};