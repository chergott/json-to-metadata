module.exports = {

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

        metadata.genre = getGenre(metadata);

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

        let disc = metadata.disc;
        if (!disc) {
            disc = metadata.diskNumber || metadata.disc_number || metadata.disk || 1;
            disc = '' + disc + '/' + disc;
        }

        let ffmpeg = {
            title: metadata.title || metadata.songName || metadata.name || null,
            artist: metadata.artist || metadata.author || null,
            album_artist: metadata.album_artist || metadata.albumArtist || null,
            album: metadata.album || null,
            // album_artwork_url: metadata.albumArtwork || null,
            copyright: metadata.copyright || null,
            date: metadata.date || null,
            genre: metadata.genre || null,
            disc: disc,
            track: metadata.track || metadata.trackNumber || metadata.track_number || null,
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

function getGenre(metadata) {
    if (metadata.genre) return metadata.genre;

    let hasGenresArray = !metadata.genre && Array.isArray(metadata.genres) && metadata.genres.length > 0;
    if (hasGenresArray) return toTitleCase(metadata.genres[0]);

    return '';

}

function isObject(item) {
    return typeof item === 'object' && item !== null;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}