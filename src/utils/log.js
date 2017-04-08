import chalk from 'chalk';
import figlet from 'figlet';
import Table from 'cli-table';
import prettyjson from 'prettyjson';


export default function (message, options = {}) {
    message = toString(message);
    let {
        type,
        color
    } = options;
    if (type && type.charAt(0) === 'h') {
        message = figlet.textSync('\n' + message, {
            horizontalLayout: 'full'
        });
    }

    if (chalk.supportsColor) {
        let chalkColor = color ? getChalkColor(color) : 'white';
        let chalkMethod = chalk[chalkColor];
        console.log(chalkMethod(message));
    } else {
        console.log(message);
    }
}

function toString(value) {
    let valueType = typeof value;
    switch (valueType) {
        case 'object':
            const JSON_OPTIONS = {
                noColor: true
            };
            return prettyjson.render(value, JSON_OPTIONS);
        case 'number':
            return '' + value + '.';
        case 'string':
            return value;
        default:
            console.log('weird valueType of: ', valueType);
    }
}

function getChalkColor(color) {
    if (!color) return 'white';

    let isSupportedColor = isColorAlias(['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray', 'black']);
    if (isSupportedColor) return color;

    let isRedAlias = isColorAlias(['scarlet', 'ruby', 'crimson', 'maroon']);
    if (isRedAlias) return 'red';

    let isGreenAlias = isColorAlias(['teal', 'olive', 'sage']);
    if (isGreenAlias) return 'green';

    let isYellowAlias = isColorAlias(['orange', 'lemon', 'gold']);
    if (isYellowAlias) return 'yellow';

    let isBlueAlias = isColorAlias(['navy']);
    if (isBlueAlias) return 'blue';

    let isMagentaAlias = isColorAlias(['purple', 'violet']);
    if (isMagentaAlias) return 'magenta';

    let isCyanAlias = isColorAlias(['sky', 'teal', 'turquoise']);
    if (isCyanAlias) return 'cyan';

    let isGrayAlias = isColorAlias(['grey']);
    if (isGrayAlias) return 'gray';

    return 'white';

    function isColorAlias(colorsArr) {
        return colorsArr.indexOf(color) > -1;
    }
}