import { ErrorCustomType } from "./error.js";
import { isObjWithForcedStringSignature } from "./util.js";
////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const domainUtil = Object.freeze({
    isType(unknown, domain) {
        if (domain.isNullable && unknown === null)
            return true;
        return (typeof unknown === domain.type);
    },
    applyDomainValidatorToDoc(domSchema, doc) {
        const incorrectFields = [];
        for (const key in domSchema) {
            const domain = domSchema[key];
            const docVal = doc[key];
            if (docVal === undefined) {
                if (domain.isOptional)
                    continue;
                incorrectFields.push(key);
                continue;
            }
            try {
                if (!domain.validate(docVal)) {
                    incorrectFields.push(key);
                }
            }
            catch (error) {
                if (error instanceof ErrorCustomType)
                    incorrectFields.push(key);
                throw error;
            }
        }
        if (incorrectFields.length > 0)
            throw new ErrorCustomType(JSON.stringify(['Incorrect fields:', ...incorrectFields]));
    },
    // Далее методы, которые проверяют, что: либо объект, либо экстракт из свойств
    // объекта, либо массив объектов или экстрактов соответствуют настройкам,
    // заложенным в доменной схеме.
    isDocSchemaExtract(unknown, extract, domSchemaAll) {
        if (!isObjWithForcedStringSignature(unknown))
            throw new ErrorCustomType('!forceStringSignature(unknown)');
        for (const key in extract) {
            const domain = domSchemaAll[key];
            if (!domainUtil.isType(unknown[key], domain))
                throw new ErrorCustomType('!domainUtil.isType(unknown[key], domain)');
        }
        if (Object.keys(extract).length !== Object.keys(unknown).length)
            throw new ErrorCustomType(`Object.keys(extract).length !== Object.keys(unknown).length`);
        return true;
    },
    isDocSchemaExtractArr(unknown, extract, domSchemaAll) {
        if (!Array.isArray(unknown))
            throw new ErrorCustomType('!Array.isArray(unknown)');
        for (let i = 0; i < unknown.length; i++) {
            if (domainUtil.isDocSchemaExtract(unknown[i], extract, domSchemaAll))
                continue;
            throw new ErrorCustomType('!Domain.isDocSchemaExtractRequired<ExtractFields, DocSchemaAll>(domSchemaAll, extract, unknown[i])');
        }
        return true;
    },
    isDocSchemaRequired(unknown, domSchema) {
        const res = domainUtil.isDocSchemaExtract(unknown, domSchema, domSchema);
        return res;
    },
    isDocSchemaRequiredArr(unknown, domSchema) {
        const res = domainUtil.isDocSchemaExtractArr(unknown, domSchema, domSchema);
        return res;
    }
});
////////////////////////////////////////////////////////////////////////////////
// Some tests.
////////////////////////////////////////////////////////////////////////////////
() => {
    const testStrDomain = {
        type: 'string',
        isNullable: false,
        validate: (val) => { return true; },
        // convert: (val: string | number) => { return val } // Error.
    };
    let test;
    if (domainUtil.isType(test, testStrDomain)) {
        test;
    } // typeof test === string
};
////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////
