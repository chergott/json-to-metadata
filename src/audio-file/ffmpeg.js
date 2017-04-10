module.exports = {

    toFFMPEG: function (metadata = {}) {

        // Track
        let hasAlbumTrackCount = !!(metadata.album_track_count);
        let hasAlbumTrackNumber = !!(metadata.track_number);
        if (hasAlbumTrackCount && hasAlbumTrackNumber) {
            metadata.track = '' + metadata.track_number + '/' + metadata.album_track_count;
        } else if (hasAlbumTrackCount) {
            metadata.track = '' + metadata.album_track_count;
        } else {
            metadata.track = '' + metadata.track_number;
        }

        // Date
        let hasDate = !!(metadata.date) && metadata.date.length > 4;
        if (hasDate) {
            let date = new Date(metadata.date);
            metadata.date = date.getFullYear();
        }

        // Copyright
        let hasCopyrights = Array.isArray(metadata.copyrights);
        if (hasCopyrights) {
            metadata.copyright = metadata.copyrights[0];
        }

        // Genre
        let hasGenre = !!(metadata.genre);
        let hasGenresArray = !hasGenre && Array.isArray(metadata.genres) && metadata.genres.length > 0;
        if (hasGenresArray) {
            metadata.genre = toTitleCase(metadata.genres[0]);
        }
        // metadata.album_artist = 'test';
        // Artist
        let hasArtist = !!(metadata.artist);
        let hasArtists = !hasArtist && metadata.artists && Array.isArray(metadata.artists);
        if (hasArtists) {
            metadata.album_artist = metadata.artists[0];
            metadata.artist = metadata.artists.map(artist => {
                return artist.name ? artist.name : artist;
            }).join(' & ');
        } else if (hasArtist && !metadata.album_artist) {
            metadata.album_artist = metadata.artist;
        }

        // Disc
        let hasDisc = !!(metadata.disc);
        if (!hasDisc) {
            metadata.disc = '' + (metadata.diskNumber || metadata.disc_number || metadata.disk || 1);
        }

        let ffmpeg = {
            title: metadata.title || metadata.songName || metadata.name,
            artist: metadata.artist || metadata.author,
            album_artist: metadata.album_artist || metadata.artist,
            album: metadata.album,
            copyright: metadata.copyright,
            date: metadata.date,
            genre: metadata.genre,
            disc: metadata.disc,
            track: metadata.track || metadata.trackNumber || metadata.track_number,
            major_brand: metadata.major_brand,
            minor_version: metadata.minor_version,
            compatible_brands: metadata.compatible_brands,
            encoder: metadata.encoder
        };

        for (let attribute in ffmpeg) {
            let value = ffmpeg[attribute];
            if (!value) {
                delete ffmpeg[attribute];
            } else if (isObject(value)) {
                ffmpeg[attribute] = value.name || value.text || value.toString();
            } else if (Number.isInteger(value)) {
                ffmpeg[attribute] = value.toString();
            }
        }
        return ffmpeg;
    }

};

function isObject(item) {
    return item && typeof item === 'object';
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}