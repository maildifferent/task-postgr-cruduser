import { domainUtil } from "./domain.js";
import { ErrorCustomSyntax, ErrorCustomType } from "./error.js";
import { isKeyOfObject } from "./util.js";
// Пример.
{
    const filter = {
        qty: [
            { $gt: 10, $lt: 20, $in: [13, 15] },
            { $gt: 20, $lt: 30 }, // implicit AND
        ],
        saleFlag: true,
        price: { $lt: 5 },
    };
    filter;
}
////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const filterUtil = Object.freeze({
    isValid(unknown, domSchemaFilter) {
        if (typeof unknown !== 'object')
            throw new ErrorCustomType('typeof unknown !== object');
        if (!unknown)
            throw new ErrorCustomType('!unknown');
        const incorrectFields = [];
        let field;
        let fieldVal; // Иначе ниже в цикле типизация fieldVal: any
        for ([field, fieldVal] of Object.entries(unknown)) {
            if (!isKeyOfObject(field, domSchemaFilter)) {
                incorrectFields.push(field);
                continue;
            }
            const domain = domSchemaFilter[field];
            if (domainUtil.isType(fieldVal, domain))
                continue;
            if (Array.isArray(fieldVal))
                throw new ErrorCustomSyntax('Not implemented: Array.isArray(fieldVal)');
            // На этом этапе должны остаться только варианты типа: {qty: { $lt: 5 }}
            // или {qty: { $gt: 10, $lt: 20, $nin: [13, 15] }}...
            try {
                if (!isComparisonOperand(fieldVal, domain))
                    incorrectFields.push(field);
            }
            catch (error) {
                incorrectFields.push(field);
            }
        }
        if (incorrectFields.length > 0)
            throw new ErrorCustomType(JSON.stringify(['Incorrect fields:', ...incorrectFields]));
        return true;
    }
});
////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////
function isComparisonOperand(unknown, domain) {
    if (typeof unknown !== 'object')
        throw new ErrorCustomType('typeof unknown !== object');
    if (!unknown)
        throw new ErrorCustomType('!unknown');
    let operator;
    let operand; // Иначе ниже в цикле типизация operand: any
    for ([operator, operand] of Object.entries(unknown)) {
        if (['$eq', '$ne', '$gt', '$lt', '$gte', '$lte'].includes(operator)) {
            if (!domainUtil.isType(operand, domain))
                return false;
            continue;
        }
        if (['$in', '$nin'].includes(operator)) {
            if (!Array.isArray(operand))
                return false;
            if (operand.length < 1)
                return false;
            let arrayVal; // Иначе ниже в цикле типизация arrayVal: any
            for (arrayVal of operand) {
                if (!domainUtil.isType(arrayVal, domain))
                    return false;
            }
            continue;
        }
        // Incorrect operator.
        return false;
    }
    return true;
}
