import metadata from './metadata';
import parseFilename from './parse-filename';

let AudioFile = module.exports = function (filepath) {
    let parsedData = parseFilename(filepath);

    this.filepath = filepath;
    this.filename = parsedData.filename;
    this.artist = parsedData.artist;
    this.title = parsedData.title;
    this.album = parsedData.album;
    this.extension = parsedData.extension;
    this.originalMetadata = {};
    this.updatedMetadata = {};
    this.errorMessage = '';
};

AudioFile.prototype.getCurrentMetadata = function () {
    let self = this;
    let filepath = this.filepath;
    return new Promise((resolve, reject) => {
        metadata.read(filepath).then(currentMetadata => {
            self.originalMetadata = currentMetadata;
            resolve(currentMetadata);
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
            localMetadata.source = 'json';
            self.updatedMetadata = localMetadata;
            resolve(localMetadata);
        } else {

            // Spotify API
            let currentMetadata = self.originalMetadata;
            metadata.getMetadataFromSpotify(currentMetadata)
                .then(spotifyMetadata => {
                    spotifyMetadata.source = 'spotify';
                    self.updatedMetadata = spotifyMetadata;
                    resolve(spotifyMetadata);
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