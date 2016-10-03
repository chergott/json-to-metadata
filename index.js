let ffmetadata = require("ffmetadata");
let fs = require('fs');
let jsonfile = require('jsonfile');


let path = 'C:/Users/conno/Downloads/';

fs.readdir(path, function(err, files) {
    if (err) return;
    let supportedFileTypes = /\.m((p3)|(4a))$/;
    files.forEach(function(file) {
        if (supportedFileTypes.test(file)) {
            console.log('Supported File: ' + file);
            let jsonFile = path + file.substring(0, file.length - 3) + 'json';
            fs.stat(jsonFile, function(err, stat) {
                if (err == null) {
                    console.log('There is a matching .json file');
                    let metadata = readJSON(jsonFile);
                    /*
                    ffmetadata.write(file, data, function(err) {
                        if (err) console.error("Error writing metadata", err);
                        else console.log("Data written");
                    });
                    */
                } else if (err.code == 'ENOENT') {
                    // file does not exist
                    console.log('.json file does not exist for ' + file);
                }
            });
            // Check if .json file exists with same filename

        }
    });

    //TODO check if json object with same name exists, if so add metadata to the audio file
});

function readJSON(path) {
    let file = path;
    jsonfile.readFile(file, function(err, obj) {
        return obj;
    });
}

//https://wiki.multimedia.cx/index.php?title=FFmpeg_Meta
function toFFMPEG(metadata) {
    return {
        title: metadata.title + metadata.songName,
        //TODO finish metadata
        data
    }
}
/*
// Read song.mp3 metadata
ffmetadata.read("song.mp3", function(err, data) {
    if (err) console.error("Error reading metadata", err);
    else console.log(data);
});

// Set the artist for song.mp3
var data = {
  artist: "Me",
};
ffmetadata.write("song.mp3", data, function(err) {
    if (err) console.error("Error writing metadata", err);
    else console.log("Data written");
});
*/
