import inquirer from 'inquirer';

export default function (type, message, choices) {
    type = convertToSupportedPromptType(type);
    let hasChoices = Array.isArray(choices);
    switch (type) {
        case 'list':
            if (!hasChoices) {
                throw "No choices were passed. Expecting an array of choices to be passed as 3rd parameter. i.e: prompt('list', <message>, <[choices]>);";
            } else {
                return promptList(message, choices);
            }
            break;
        case 'confirm':
            return promptConfirmation(message);
        case 'input':
            let defaultValue = choices;
            return promptInput(message, defaultValue);
    }
}

function promptList(message, choices) {
    let listOptions = {
        type: 'list',
        name: 'input',
        message,
        choices
    };
    return inquirer.prompt([listOptions]).then(selection => {
        return selection.input;
    });
}

function promptInput(message, defaultValue) {
    let inputOptions = {
        type: 'input',
        name: 'input',
        message,
        default: defaultValue
    };
    return inquirer.prompt([inputOptions]).then(selection => {
        return selection.input;
    });
}

function promptConfirmation(message) {
    let confirmOptions = {
        type: 'confirm',
        name: 'input',
        message,
        default: false
    };
    return inquirer.prompt([confirmOptions]).then(selection => {
        return selection.input;
    });
}

function convertToSupportedPromptType(type) {
    type = type.toLowerCase();
    let isSupportedType = ['list', 'rawlist', 'expand', 'checkbox', 'confirm', 'input', 'password', 'editor'].indexOf(type) > -1;
    if (isSupportedType) return type;
    return 'list';
}