////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const docSchemaUtil = Object.freeze({
    isValidFieldValueType(unknown) {
        return unknown === null
            || typeof unknown === 'string'
            || typeof unknown === 'number'
            || typeof unknown === 'boolean'
            || typeof unknown === 'bigint';
    }
});
