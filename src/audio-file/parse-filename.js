import path from 'path';

module.exports = function (filepath) {
    let filename = path.basename(filepath);

    let parsedData = {
        // extension: parseExtension(filename),
        artist: parseArtist(filename),
        title: parseTitle(filename)
    };

    return parsedData;
};

function parseExtension(filename) {
    let extension = filename.slice(-3) || null;
    return extension;
}

function parseArtist(filename) {
    let filenameNoExtension = filename.slice(0, -4);
    let hyphenIndex = filename.indexOf('-');
    return hyphenIndex > 0 ? filenameNoExtension.substring(0, hyphenIndex) : null;
}

function parseTitle(filename) {
    let filenameNoExtension = filename.slice(0, -4);
    let hyphenIndex = filename.indexOf('-');
    let title = hyphenIndex > -1 ? filenameNoExtension.substring(hyphenIndex + 1) : filenameNoExtension;

    let featuringArtist = extractFeaturingArtist(title);
    if (featuringArtist)
        title = title.replace(featuringArtist, '');

    return title ? title.trim() : title;
}

function extractFeaturingArtist(title) {
    let featuringArtistRegEx = /\(feat.*\)+/i;
    let hasFeaturingArtist = featuringArtistRegEx.exec(title);
    if (hasFeaturingArtist) {
        return hasFeaturingArtist[0];
    }
    return null;
}