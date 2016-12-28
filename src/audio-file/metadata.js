import fs from 'fs';
import ffmetadata from 'ffmetadata';
import request from 'request';
import jsonfile from 'jsonfile';
import RSVP from 'rsvp';

module.exports = {

    read: function (filepath) {
        return new Promise(function (resolve, reject) {
            ffmetadata.read(filepath, function (err, metadata) {
                if (err) {
                    console.error("Error reading metadata", err);
                    reject();
                } else {
                    resolve(metadata);
                }
            });
        });
    },

    write: function (filepath, metadata) {
        metadata = this.toFFMPEG(metadata);
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
        return this.toFFMPEG(metadata);
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
                if (error || response.statusCode !== 200) reject();

                let spotifyObj = JSON.parse(body);
                if (spotifyObj.hasOwnProperty('tracks')) {
                    let trackMetadata = getMatchingTitleMetadata(spotifyObj.tracks, metadata);

                    // Get artist metadata
                    let trackFirstArtist = trackMetadata.artists[0];
                    let artistMetadataApi = getMetadataFromSpotifyApi(trackFirstArtist.href);
                    // Get album metadata
                    let albumMetadataApi = getMetadataFromSpotifyApi(trackMetadata.album.href);
                    RSVP.all([artistMetadataApi, albumMetadataApi])
                        .then(additionalMetadata => {
                            let artistMetadata = additionalMetadata[0];
                            let albumMetadata = additionalMetadata[1];
                            trackMetadata.genres = artistMetadata.genres; // Genres
                            trackMetadata.date = albumMetadata.release_date; // Date
                            trackMetadata.copyrights = albumMetadata.copyrights; // Copyrights
                            trackMetadata.album_track_count = albumMetadata.tracks.items.length; // Album Track Count
                            resolve(self.toFFMPEG(trackMetadata));
                        })
                        .catch(e => {
                            reject(e);
                        });
                } else if (spotifyObj.hasOwnProperty('artists')) {
                    resolve(getMatchingArtistMetadata(spotifyObj.artists, metadata.artist));
                } else {
                    reject();
                }

            });
        });
    },

    toFFMPEG: function (metadata = {}) {

        let hasAlbumTrackCount = !!(metadata.album_track_count && metadata.track_number);
        if (hasAlbumTrackCount) {
            metadata.track = '' + metadata.track_number + '/' + metadata.album_track_count;
        } 

        let hasDate = !!(metadata.date) && metadata.date.length > 4;
        if (hasDate) {
            let date = new Date(metadata.date);
            metadata.date = date.getFullYear();
        }

        let hasCopyrights = Array.isArray(metadata.copyrights);
        if (hasCopyrights) {
            metadata.copyright = metadata.copyrights[0];
        }

        let hasGenres = Array.isArray(metadata.genres) && !metadata.genre;
        if (hasGenres) {
            metadata.genre = toTitleCase(metadata.genres[0]);
        }

        let hasArtists = Array.isArray(metadata.artists) && !metadata.artist;
        if (hasArtists) {
            metadata.album_artist = metadata.artists[0];
            metadata.artist = metadata.artists.map(artist => {
                return artist.name ? artist.name : artist;
            }).join(' & ');
        }

        let hasAlbumArtworkImages = isObject(metadata.album) && Array.isArray(metadata.album.images);
        if (hasAlbumArtworkImages) {
            // metadata.album_artwork_url = metadata.album.images[0].url;
        }

        let disc = metadata.disc || metadata.diskNumber || metadata.disc_number || metadata.disk || null;
        disc = '' + disc + '/' + disc;

        let ffmpeg = {
            title: metadata.title || metadata.songName || metadata.name || null,
            artist: metadata.artist || metadata.author || null,
            album_artist: metadata.album_artist || metadata.albumArtist || null,
            album: metadata.album || null,
            // album_artwork_url: metadata.albumArtwork || null,
            copyright: metadata.copyright || null,
            date: metadata.date || null,
            genre: metadata.genre || null,
            disc: disc || null,
            track: metadata.track || metadata.trackNumber || metadata.track_number || null
        };

        for (let attribute in ffmpeg) {
            let value = ffmpeg[attribute];
            if (!value) {
                delete ffmpeg[attribute];
            } else if (isObject(value)) {
                ffmpeg[attribute] = value.name || value.text || value.toString();
            }
        }
        return ffmpeg;
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

function getMatchingTitleMetadata(tracks, metadata) {
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

        possibleMatches.push(track);

        let hasAlbum = !!(album);
        let hasArtist = !!(artist);
        if (hasAlbum && isMatch(album, track.album.name)) {
            return track;
        } else if (hasArtist && isMatch(artist, artists)) {
            return track;
        } else if (isMatch(title, track.name)) {
            return track;
        }
    }
    console.log('Could not find match for ' + title + ' in: ', possibleMatches);
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

function isObject(item) {
    return typeof item === 'object' && item !== null;
}

function isExactMatch(str1, str2) {
    return str1.toLowerCase() === str2.toLowerCase();
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function getMetadataFromSpotifyApi(url) {
    return new RSVP.Promise(function (resolve, reject) {
        request(url, (error, response, body) => {
            if (error || response.statusCode !== 200) reject();
            let metadata = JSON.parse(body);
            resolve(metadata);
        });
    });
}