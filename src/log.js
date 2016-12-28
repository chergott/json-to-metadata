import chalk from 'chalk';
import figlet from 'figlet';
import prettyjson from 'prettyjson';
import Table from 'cli-table';

export default function (message = '', options = {}) {
    let type = options.type || 'p';
    let chalkColor = getChalkColor(options.color);
    let chalkBackground = null,
        chalkFormat = null;
    let chalkMethod = chalk[chalkColor];
    let jsonOptions = {
        noColor: true
    };

    let hasBackground = !!(options.background);
    if (hasBackground) {
        chalkBackground = getChalkColor(options.background);
        chalkBackground = 'bg' + chalkBackground.charAt(0).toUpperCase() + chalkBackground.substr(1);
        chalkMethod = chalkMethod[chalkBackground];
    }

    let hasFormat = !!(options.format);
    if (hasFormat) {
        chalkFormat = options.format;
        chalkMethod = chalkMethod[chalkFormat];
    }

    let isHeading = type.charAt(0) === 'h';
    if (isHeading) {
        message = figlet.textSync('\n' + message, {
            horizontalLayout: 'full'
        });
    }

    let isTable = type.charAt(0) === 't';
    if (isTable) {
        let borderColor = getChalkColor(options.borderColor || 'grey');
        let table = new Table({ 
            head: options.head || null,
            style: {
                head: ['white'],
                border: [borderColor]
            }
        });

        if (Array.isArray(message)) {
            message = message.map(value => {
                if (typeof value === 'object') {
                    return prettyjson.render(value, jsonOptions);
                }
                return value;
            });
        }
        table.push(message);

        message = table.toString();
    }

    let isObject = typeof message === 'object';
    if (isObject) {
        message = prettyjson.render(message, jsonOptions);
    }

    if (!chalk.supportsColor) {
        console.log(message);
    } else {
        console.log(chalkMethod(message));
    }
}

function getChalkColor(color) {
    if (!color) return 'white';

    let supportedColors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray', 'black'];
    let isSupportedColor = supportedColors.indexOf(color) > -1;
    if (isSupportedColor) return color;

    let redAliases = ['scarlet', 'ruby', 'crimson', 'maroon'];
    let isRedAlias = redAliases.indexOf(color) > -1;
    if (isRedAlias) return 'red';

    let greenAliases = ['teal', 'olive', 'sage'];
    let isGreenAlias = greenAliases.indexOf(color) > -1;
    if (isGreenAlias) return 'green';

    let yellowAliases = ['orange', 'lemon', 'gold'];
    let isYellowAlias = yellowAliases.indexOf(color) > -1;
    if (isYellowAlias) return 'yellow';

    let blueAliases = ['navy'];
    let isBlueAlias = blueAliases.indexOf(color) > -1;
    if (isBlueAlias) return 'blue';

    let magentaAliases = ['purple', 'violet'];
    let isMagentaAlias = magentaAliases.indexOf(color) > -1;
    if (isMagentaAlias) return 'magenta';

    let cyanAliases = ['sky', 'teal', 'turquoise'];
    let isCyanAlias = cyanAliases.indexOf(color) > -1;
    if (isCyanAlias) return 'cyan';

    let grayAliases = ['grey'];
    let isGrayAlias = grayAliases.indexOf(color) > -1;
    if (isGrayAlias) return 'gray';

    return 'white';
}