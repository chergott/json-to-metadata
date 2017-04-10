import RSVP from 'rsvp';
import request from 'request';

module.exports = function (metadata) {

    let promise = new RSVP.Promise(function (resolve, reject) {
        let hasTitle = !!(metadata.title);
        if (!hasTitle) {
            console.log('metadata.title is required.');
            reject();
        }

        let searchUrl = getSpotifySearchUrl({
            type: 'track',
            query: encodeQuery(metadata.title),
        });

        queryAPI(searchUrl)
            .then(spotifyObj => {
                let track = findTrackMatch(spotifyObj.tracks, metadata);

                let hasTrackMatch = typeof track !== 'object';
                if (hasTrackMatch) {
                    console.log('Could not find a match for ' + JSON.stringify(metadata) + ' through Spotify.');
                    reject();
                } else {
                    // Get extra metadata like genres from artist and album metadata
                    let artistUrl = track.artists[0].href;
                    let albumUrl = track.album.href;
                    RSVP.all([queryAPI(artistUrl), queryAPI(albumUrl)])
                        .then(additionalMetadata => {
                            // Artist Metadata
                            let artistMetadata = additionalMetadata[0];
                            track.genres = artistMetadata.genres; // Genres
                            // Album Metadata
                            let albumMetadata = additionalMetadata[1];
                            track.date = albumMetadata.release_date; // Date
                            track.copyrights = albumMetadata.copyrights; // Copyrights
                            track.album_track_count = albumMetadata.tracks.items.length; // Album Track Count
                            resolve(track);
                        })
                        .catch(error => {
                            console.log('Could not find additional metadata from the artist or album: ', error);
                            resolve(track);
                        });
                }
            })
            .catch(() => {
                reject(metadata);
            });
    });
    return promise;
};

function getSpotifySearchUrl(options) {
    let {
        query,
        type = 'track',
        limit = 30
    } = options;
    let queryParams = '?q=' + query + '&type=' + type + '&limit=' + limit;
    return 'https://api.spotify.com/v1/search' + queryParams;
}

function queryAPI(url) {
    let promise = new Promise(function (resolve, reject) {
        request(url, (error, response, body) => {
            if (error || response.statusCode !== 200) {
                console.log('Spotify API Bad Request');
                reject();
            } else {
                let jsonResponse = JSON.parse(body);
                resolve(jsonResponse);
            }
            return;
        });
    });
    return promise;
}


function findTrackMatch(tracks, metadata) {
    let {
        title,
        artist,
        album
    } = metadata;
    let items = tracks.items;
    let possibleMatches = [];

    for (let index in items) {

        let track = items[index];
        let artists = track.artists.map(trackArtist => {
            return trackArtist.name;
        });

        possibleMatches.push({
            title: track.name,
            artist: artists.join(' & '),
            album: track.album.name
        });

        let hasAlbum = !!(album);
        let hasArtist = !!(artist);

        let isAlbumMatch = hasAlbum && isExactMatch(album, track.album.name);
        let isArtistMatch = hasArtist && isMatch(artist, artists);
        let isTitleMatch = !hasAlbum && !hasArtist && isExactMatch(title, track.name);

        if (isAlbumMatch || isArtistMatch || isTitleMatch) {
            return track;
        }
    }
    // + JSON.stringify(possibleMatches)
    return null;
}

function encodeQuery(uri) {
    let encoded = uri;
    // White space
    encoded = encoded.replace(/\s/g, '+');
    // & => %26
    encoded = encoded.replace(/&/g, '%26');
    // ' => %27
    encoded = encoded.replace(/'/g, '%27');
    // ( => %28
    encoded = encoded.replace(/\(/g, '%28');
    // ) => %29
    encoded = encoded.replace(/\)/g, '%29');

    // Cases like Tiësto
    encoded = encoded.replace(/[\xE9|\xEA|\xEB]/gi, 'e');
    return encoded;
}

function isMatch(item1 = '', item2 = '') {
    if (Array.isArray(item1)) {
        item1 = item1.join(' & ');
    }
    if (Array.isArray(item2)) {
        item2 = item2.join(' & ');
    }
    if (item1.length > item2.length) return item1.toUpperCase().includes(item2.toUpperCase());
    return item2.toUpperCase().includes(item1.toUpperCase());
}

function isExactMatch(str1, str2) {
    return str1.toLowerCase() === str2.toLowerCase();
}