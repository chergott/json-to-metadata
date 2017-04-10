import path from 'path';

module.exports = function (filepath) {
    let filename = path.basename(filepath);
    let artist = null,
        title = null;

    let hyphenSplit = filename.split('-');
    let hyphenCount = hyphenSplit.length;

    if (hyphenCount === 1) {
        title = hyphenSplit[0];
    } else if (hyphenSplit.length === 2) {
        artist = hyphenSplit[0];
        title = hyphenSplit[1];
    } else {
        title = hyphenSplit.pop();
        artist = hyphenSplit.join('-');
    }

    let featuringArtist = extractFeaturingArtist(title);
    if (featuringArtist)
        title = title.replace(featuringArtist, '');

    // Remove trailing extension if it exists
    title = title.split('.')[0];

    return {
        artist: artist ? artist.trim() : null,
        title: title ? title.trim() : null,
    };
};

function extractFeaturingArtist(title) {
    let featuringArtistRegEx = /\(feat.*\)+/i;
    let hasFeaturingArtist = featuringArtistRegEx.exec(title);
    return hasFeaturingArtist ? hasFeaturingArtist[0] : null;
}