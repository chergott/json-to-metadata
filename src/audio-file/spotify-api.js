import RSVP from 'rsvp';
import request from 'request';
import ffmpeg from './ffmpeg';

module.exports = function (metadata) {
    let self = this;
    let hasTitle = !!(metadata.title);
    let hasArtist = !!(metadata.artist);
    let hasAlbum = !!(metadata.album);

    let queryParams = {};

    return new RSVP.Promise(function (resolve, reject) {

        let searchUrl = getSpotifySearchUrl({
            type: 'track',
            query: encodeURI(metadata.title),
        });

        getApiResponse(searchUrl)
            .then(spotifyObj => {
                let track = findTrackMatch(spotifyObj.tracks, metadata);
                // console.log('trackMatch: ', track);
                if (!track) {
                    return reject(track);
                }

                 // Get artist & album metadata
                let artistUrl = track.artists[0].href;
                let albumUrl = track.album.href;
                
                RSVP.all([getApiResponse(artistUrl), getApiResponse(albumUrl)])
                    .then(additionalMetadata => {
                        let artistMetadata = additionalMetadata[0];
                        track.genres = artistMetadata.genres; // Genres

                        let albumMetadata = additionalMetadata[1];
                        track.date = albumMetadata.release_date; // Date
                        track.copyrights = albumMetadata.copyrights; // Copyrights
                        track.album_track_count = albumMetadata.tracks.items.length; // Album Track Count
                        return resolve(track);
                    })
                    .catch(error => {
                        console.log('error?: ', error);
                        return reject(track);
                    });
                // console.log('getting artist metadata...');
                // getApiResponse(artistUrl).then(additionalMetadata => {
                //     console.log('received artist: ', additionalMetadata);
                //     // let artistMetadata = additionalMetadata[0];
                //     // track.genres = artistMetadata.genres; // Genres
                //     // resolve(track);
                // });
                // console.log('getting album metadata...');
                // getApiResponse(albumUrl).then(additionalMetadata => {
                //     console.log('received album: ', additionalMetadata);
                //     // let albumMetadata = additionalMetadata[1];
                //     // track.date = albumMetadata.release_date; // Date
                //     // track.copyrights = albumMetadata.copyrights; // Copyrights
                //     // track.album_track_count = albumMetadata.tracks.items.length; // Album Track Count
                //     // resolve(track);
                // });

                // return resolve(ffmpeg.toFFMPEG(track));
            })
            .catch(() => {
                reject(track);
            });

        // getAdditionalMetadata(artistUrl, albumUrl).then(additionalMetadata => {
        //     console.log('received: ', additionalMetadata);
        //     // track = Object.assign(track, ffmpeg.toFFMPEG(additionalMetadata));
        //     // resolve(ffmpeg.toFFMPEG(track));
        //     resolve();
        // });



    });
};

function getAdditionalMetadata(artistUrl, albumUrl) {
    // Get artist & album metadata
    return RSVP.hash([getApiResponse(artistUrl), getApiResponse(albumUrl)])
        .then(additionalMetadata => {
            let track = {};

            let artistMetadata = additionalMetadata[0];
            track.genres = artistMetadata.genres; // Genres

            let albumMetadata = additionalMetadata[1];
            track.date = albumMetadata.release_date; // Date
            track.copyrights = albumMetadata.copyrights; // Copyrights
            track.album_track_count = albumMetadata.tracks.items.length; // Album Track Count
            console.log('traksadasd: ', track);
            resolve(track);
            // return {
            //     title: 'test'
            // };
        })
        .catch(() => {
            reject('Issue finding additional metadata for  ', track);
        });
}

function getSpotifySearchUrl(options) {
    let {
        query,
        type = 'track',
        limit = 30
    } = options;
    let queryParams = '?q=' + query + '&type=' + type + '&limit=' + limit;
    return 'https://api.spotify.com/v1/search' + queryParams;
}

function getApiResponse(url) {
    return new RSVP.Promise(function (resolve, reject) {
        request(url, (error, response, body) => {
            if (error || response.statusCode !== 200) {
                reject(error);
                return;
            }
            resolve(JSON.parse(body));
        });
    });
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
        if (hasAlbum) {
            if (isMatch(album, track.album.name)) return track;
        }
        if (hasArtist) {
            if (isMatch(artist, artists)) return track;
        } else if (isExactMatch(title, track.name)) {
            return track;
        }
    }
    // console.log('Could not find match for ' + title, artist + ' in: ', possibleMatches);
    return false;
}

function encodeURI(uri) {
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
    return encoded;
}

function isMatch(item1 = '', item2 = '') {
    if (Array.isArray(item1)) {
        item1 = item1.join(' & ');
    } else if (Array.isArray(item2)) {
        item2 = item2.join(' & ');
    }
    if (item1.length > item2.length) return item1.toUpperCase().includes(item2.toUpperCase());
    else return item2.toUpperCase().includes(item1.toUpperCase());
}

function isExactMatch(str1, str2) {
    return str1.toLowerCase() === str2.toLowerCase();
}