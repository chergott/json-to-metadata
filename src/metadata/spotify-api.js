import RSVP from 'rsvp';
import request from 'request';

module.exports = {

    search: function (metadata = {}) {
        let isString = typeof metadata === 'string';
        if (isString) metadata.title = metadata;

        let self = this;
        let hasTitle = !!(metadata.title);
        let hasArtist = !!(metadata.artist);
        let hasAlbum = !!(metadata.album);

        let queryParams = {};

        // return new Promise(function (resolve, reject) {
        if (hasTitle) {
            queryParams = {
                type: 'track',
                query: encodeURI(metadata.title),
                limit: 10
            };

            return searchSpotify(queryParams)
                .then((spotifyObj) => {
                    return findTrackMatch(spotifyObj.tracks, metadata);
                });

        } else if (hasArtist) {
            queryParams = {
                type: 'artist',
                query: encodeURI(metadata.artist),
                limit: 5
            };
            //TODO artist search
        } else if (hasAlbum) {
            queryParams = {
                type: 'album',
                query: encodeURI(metadata.album),
                limit: 3
            };
            //TODO album search
        } else {
            reject();
        }

        // resolve(searchSpotify(queryParams));

        // getMetadataFromSpotifyApi(spotifyURL).then(spotifyObj => {

        //     if (spotifyObj.hasOwnProperty('tracks')) {
        //         let trackMetadata = getMatchingTitleMetadata(spotifyObj.tracks, metadata);
        //         if (!trackMetadata) return reject();
        //         // Get artist metadata
        //         let trackFirstArtist = trackMetadata.artists[0];
        //         let artistMetadataApi = getMetadataFromSpotifyApi(trackFirstArtist.href);
        //         // Get album metadata
        //         let albumMetadataApi = getMetadataFromSpotifyApi(trackMetadata.album.href);
        //         RSVP.all([artistMetadataApi, albumMetadataApi])
        //             .then(additionalMetadata => {
        //                 let artistMetadata = additionalMetadata[0];
        //                 let albumMetadata = additionalMetadata[1];
        //                 trackMetadata.genres = artistMetadata.genres; // Genres
        //                 trackMetadata.date = albumMetadata.release_date; // Date
        //                 trackMetadata.copyrights = albumMetadata.copyrights; // Copyrights
        //                 trackMetadata.album_track_count = albumMetadata.tracks.items.length; // Album Track Count
        //                 resolve(self.toFFMPEG(trackMetadata));
        //             })
        //             .catch(e => {
        //                 reject(e);
        //             });
        //     } else if (spotifyObj.hasOwnProperty('artists')) {
        //         resolve(getMatchingArtistMetadata(spotifyObj.artists, metadata.artist));
        //     } else {
        //         reject();
        //     }
        // }).catch(error => {
        //     console.log(`Could not query ${query} using ${spotifyURL}\n Error: ${error}`);
        // });
    }
};


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

function searchSpotify(options) {
    let {
        query,
        type,
        limit
    } = options;
    let hasValidOptions = (query && type && limit);
    if (!hasValidOptions) return false;
    let queryParams = '?q=' + query + '&type=' + type + '&limit=' + limit;
    let spotifySearchURL = 'https://api.spotify.com/v1/search' + queryParams;
    return getMetadataFromURL(spotifySearchURL);
}

function getMetadataFromURL(url) {
    // console.log('^ Finding metadata from Spotify: ', url);
    return new RSVP.Promise(function (resolve, reject) {
        request(url, (error, response, body) => {
            if (error || response.statusCode !== 200) reject(error);
            let metadata = JSON.parse(body);
            resolve(metadata);
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
        } else if (hasArtist) {
            if (isMatch(artist, artists)) return track;
        } else if (isExactMatch(title, track.name)) {
            return track;
        }
    }
    // console.log('Could not find match for ' + title + ' in: ', possibleMatches);
    return false;
}



function isMatch(item1 = '', item2 = '') {
    if (Array.isArray(item1)) {
        item1 = item1.join(' ');
    } else if (Array.isArray(item2)) {
        item2 = item2.join(' ');
    }
    if (item1.length > item2.length) return item1.toUpperCase().includes(item2.toUpperCase());
    return item2.toUpperCase().includes(item1.toUpperCase());
}

function isExactMatch(str1, str2) {
    return str1.toLowerCase() === str2.toLowerCase();
}