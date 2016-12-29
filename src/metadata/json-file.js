import fs from 'fs';
import jsonfile from 'jsonfile';

module.exports = {
    readFileSync: function (filepath) {
        let isValidJSON = fs.existsSync(filepath) && filepath.indexOf('.json') > -1;
        if (!isValidJSON) return false;

        return jsonfile.readFileSync(filepath);
    }
};