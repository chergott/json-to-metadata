import metadata from './metadata';
import parseFilename from './parse-filename';

let AudioFile = module.exports = function (filepath) {
    let parsedData = parseFilename(filepath);
    this.filepath = filepath;
    this.filename = parsedData.filename;
    this.currentMetadata = {};

    this.assignMetadata(parsedData);

    this.originalMetadata = this.currentMetadata;

    this.errorMessage = '';
};

AudioFile.prototype.getCurrentMetadata = function () {
    let self = this;
    let filepath = this.filepath;
    return new Promise((resolve, reject) => {
        metadata.read(filepath).then(localMetadata => {
            self.originalMetadata = localMetadata;
            if (!localMetadata.artist) {
                localMetadata.artist = self.currentMetadata.artist;
            }
            if (!localMetadata.title) {
                localMetadata.title = self.currentMetadata.title;
            }
            self.assignMetadata(localMetadata);
            resolve(localMetadata);
        });
    });
};

AudioFile.prototype.getExternalMetadata = function () {
    let self = this;
    let filepath = this.filepath;
    let possibleLocalJSONFilePath = filepath.substring(0, filepath.length - 3) + 'json';

    return new Promise(function (resolve, reject) {

        let localMetadata = metadata.getMetadataFromJSONFile(possibleLocalJSONFilePath);
        // SWITCH to not check for a local JSON file (used with Lute Chrome Extension) but there's no real harm for a quick check
        // localMetadata = false;

        // Local JSON File
        if (localMetadata) {
            self.assignMetadata(localMetadata);
            resolve(localMetadata);
        } else {
            // Spotify API
            metadata.getMetadataFromSpotify(self.currentMetadata)
                .then(spotifyMetadata => {
                    self.assignMetadata(spotifyMetadata);
                    resolve(self.currentMetadata);
                }).catch(function (e) {
                    self.errorMessage = 'Could not find metadata from Spotify';
                    reject(e);
                });
        }
    });
};

AudioFile.prototype.writeMetadata = function (newMetadata) {
    let self = this;
    return new Promise(function (resolve, reject) {
        resolve(metadata.write(self.filepath, newMetadata));
    });

};

AudioFile.prototype.assignMetadata = function (updatedMetadata) {
    this.currentMetadata = updatedMetadata || this.currentMetadata;
};