export default metadata;

function metadata() {
    this.metadata = null;
}

let fn = metadata.prototype;

fn.getMetadataFromFile = function (filepath) {

    console.log('Checking if ' + possibleJSONFilePath + ' exists...');
    let hasMatch = fs.existsSync(possibleJSONFilePath);
    if (hasMatch) {
        console.log('Found a match! ' + possibleJSONFilePath);
        let jsonFile = possibleJSONFilePath;
        this.metadata = JSONFile.readFileSync(possibleJSONFilePath);
        return this.metadata;

    } else {
        console.log('No match found for ' + filepath);
        this.metadata = null;
        return this.metadata;
    }
};