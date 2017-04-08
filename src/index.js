import fs from 'fs-extra';
import os from 'os';
import clear from 'clear';
import AudioFile from './audio-file';
import SongMetadata from './song-metadata';
import prompt from './utils/prompt';
import log from './utils/log';

(function () {
    init();
})();

function init() {
    // let songMetadata = new SongMetadata();
    clear();
    log('Song Metadata', {
        type: 'heading',
        color: 'cyan'
    });
    menu();
}

function menu() {
    prompt('list', 'Where are your music files located?', ['Auto', 'iTunes', 'Custom'])
        .then(location => {

            switch (location) {

                case 'Auto':
                    prompt('confirm', 'Are you sure? This will scan almost every file on your computer and could take a long time.')
                        .then(confirmation => {
                            if (confirmation) {
                                let homeDirectory = os.homedir();
                                scanForAudioFiles(homeDirectory);
                            } else {
                                menu();
                                return;
                            }
                        });
                    break;

                case 'iTunes':
                    let iTunesDirectory = os.homedir() + '\\Music\\iTunes\\iTunes Media';
                    scanForAudioFiles(iTunesDirectory);
                    break;

                case 'Custom':
                    let defaultDirectory = os.homedir() + '\\Downloads';
                    prompt('input', 'What directory would you like to scan?', defaultDirectory)
                        .then(customDirectory => {
                            scanForAudioFiles(customDirectory);
                        });
                    break;
            }
        });
}

function scanForAudioFiles(directory) {
    let self = this;
    let audioFiles = [];

    fs.walk(directory)
        .on('data', (file) => {
            let filepath = file.path;

            if (isAudioFile(filepath)) {
                audioFiles.push(filepath);
            } else {
                return;
            }
        })
        .on('end', function () {
            audioFiles.forEach(filepath => {
                let audioFile = new AudioFile(filepath);
                audioFile.readMetadata()
                    .then(audioFile.findMetadata()
                        .then(spotifyMetadata => {
                            audioFile.stageMetadata(spotifyMetadata);
                            log(audioFile.toString() + '\n');
                            audioFile.writeMetadata();
                        }));
            });
        });
}


function isAudioFile(file) {
    const REGEX_AUDIO_FILE_TYPES = /\.m(p3|4a)$/;
    return REGEX_AUDIO_FILE_TYPES.test(file);
}


//  let audioFile = new AudioFile(filepath);
//             self.onFoundAudioFile(audioFile);

//             audioFile.getMetadata()
//                 .then(metadata => {
//                     self.onHasMetadata();

//                     let hasInvalidMetadata = !metadata;
//                     if (hasInvalidMetadata) {
//                         self.onHasInvalidAudioFileMetadata(audioFile);

//                     } else if (hasNewMetadata(audioFile)) {
//                         self.onDiscoveredNewMetadata(audioFile);

//                         audioFile.writeMetadata(metadata);

//                     } else {
//                         self.onDiscoveredSameMetadata(audioFile);
//                     }

//                     if (self.count === self.total) self.onFinish();

//                 })
//                 .catch(error => {
//                     console.log('ERROR: ', error);
//                     self.onHasInvalidAudioFileMetadata(audioFile);
//                 });
//         })
//         .on('end', function () {
//             this.total = this.number;
//         });