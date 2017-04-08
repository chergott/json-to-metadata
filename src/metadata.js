module.exports = {
    compare: function (original, current) {
        let additions = [];
        let differences = [];

        for (let property in current) {
            let obj = {};
            let originalProperty = original[property];
            let currentProperty = current[property];

            if (originalProperty === null) {
                additions.push({}[property] = {
                    current: currentProperty
                });

            } else if (originalProperty !== currentProperty) {
                differences.push({}[property] = {
                    original: originalProperty,
                    current: currentProperty
                });
            }
        }
        return {
            additions,
            differences
        };
    }
};