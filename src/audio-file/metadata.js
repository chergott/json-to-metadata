import fs from 'fs';
import ffmetadata from 'ffmetadata';
import request from 'request';
import jsonfile from 'jsonfile';

module.exports = {

    read: function (filepath) {
        return new Promise(function (resolve, reject) {
            ffmetadata.read(filepath, function (err, data) {
                if (err) {
                    console.error("Error reading metadata", err);
                    reject();
                } else {
                    let metadata = {
                        title: data.title,
                        artist: data.artist,
                        album: data.album,
                        albumArtwork: data.albumArtwork,
                        genre: data.genre
                    };
                    resolve(metadata);
                }
            });
        });
    },

    write: function (filepath, metadata) {
        metadata = toFFMPEG(metadata);
        let hasArtwork = metadata.albumArtworkPath ? true : false;
        let options = {};

        if (hasArtwork) {
            options.attachments = [metadata.albumArtwork];
        }

        ffmetadata.write(filepath, metadata, options, function (err) {
            if (err) console.error("Error writing metadata", err);
            else {
                if (hasArtwork) {
                    // remove album artwork image
                    fs.unlink(options.attachments[0]);
                }
                // console.log('wrote ', metadata, ' to ', filepath);
            }
        });
    },

    getMetadataFromJSONFile: function (filepath) {
        let isValidJSON = fs.existsSync(filepath) && filepath.indexOf('.json') > -1;

        if (!isValidJSON) return false;

        let metadata = jsonfile.readFileSync(filepath);
        return metadata;
    },

    getMetadataFromSpotify: function (metadata = {}) {
        let self = this;
        let hasTitle = !!(metadata.title);
        let hasArtist = !!(metadata.artist);
        let hasAlbum = !!(metadata.album);
        let hasGenres = !!(metadata.genre);

        let type = null,
            query = null,
            limit = null;

        return new Promise(function (resolve, reject) {
            if (hasTitle) {
                type = 'track';
                query = encodeURI(metadata.title);
                limit = 10;
            } else if (hasArtist) {
                type = 'artist';
                query = encodeURI(metadata.artist);
                limit = 5;
            } else if (hasAlbum) {
                type = 'album';
                query = encodeURI(metadata.album);
                limit = 3;
            } else {
                reject();
            }

            let queryParams = '?q=' + query + '&type=' + type + '&limit=' + limit;
            let spotifyURL = 'https://api.spotify.com/v1/search' + queryParams;
            request(spotifyURL, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let spotifyObj = JSON.parse(body);
                    if (spotifyObj.hasOwnProperty('tracks')) {
                        let trackMetadata = getMatchingTitleMetadata(spotifyObj.tracks, metadata.title, metadata.artist);
                        // Get genres from artist metadata
                        return self.getMetadataFromSpotify({
                                artist: trackMetadata.artist
                            })
                            .then(artistMetadata => {
                                // console.log('I got some genres for ', metadata.artist ,'... you want some? ', artistMetadata.genres);
                                // trackMetadata.genre = artistMetadata.genres.join(', ');
                                trackMetadata.genre = artistMetadata.genres[0];
                                resolve(trackMetadata);
                            });
                    } else if (spotifyObj.hasOwnProperty('artists')) {
                        resolve(getMatchingArtistMetadata(spotifyObj.artists, metadata.artist));
                    } else {
                        reject();
                    }
                }
            });
        });
    }
};

function toFFMPEG(metadata) {
    let ffmpeg = {
        title: metadata.title || metadata.songName || null,
        artist: metadata.artist || metadata.author || null,
        album: metadata.album || null,
        albumArtwork: metadata.albumArtwork || metadata.albumArtworkURL || null,
        genre: metadata.genre || null,
        disc: metadata.disc || metadata.diskNumber || metadata.disk || null,
        // explicit: metadata.explicit || null,
        track: metadata.track || metadata.trackNumber || null
    };
    return ffmpeg;
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

function getMatchingTitleMetadata(tracks, title, artist) {
    let songTitle = title ? title.toUpperCase() : null;
    let songArtist = artist ? artist.toUpperCase() : null;

    let items = tracks.items;
    let possibleMatches = [];

    for (let index in items) {

        let track = items[index];
        let artist = track.artists[0].name;
        let album = track.album.name;
        let title = track.name;
        let albumArtworkURL = track.album.images[0].url;
        let disc = track.disc_number;
        let explicit = track.explicit;
        let trackNumber = track.track_number;
        let trackMetadata = {
            title,
            artist,
            album,
            albumArtworkURL,
            disc,
            explicit,
            trackNumber
        };
        possibleMatches.push(trackMetadata);
        let isMatchingTrack = (songArtist && songArtist.includes(artist.toUpperCase())) || !songArtist && songTitle === title.toUpperCase();
        if (isMatchingTrack) return trackMetadata;
    }
    console.log('Could not find match for ' + songTitle + ' in: ', possibleMatches);
    return false;
}

function getMatchingArtistMetadata(artists, name) {

    let items = artists.items;

    for (let index in items) {

        let artist = items[index];
        let isMatchingArtist = artist.name.toLowerCase() === name.toLowerCase();
        if (isMatchingArtist) return {
            genres: artist.genres,
            images: artist.images,
            name: artist.name,
            popularity: artist.popularity
        };
    }
    console.log('Could not find matching artist ' + artist);
    return false;
}