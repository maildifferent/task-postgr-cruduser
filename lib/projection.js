import { ErrorCustomType, ErrorCustomSyntax } from "./error.js";
////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const projectionUtil = Object.freeze({
    isSubsetOfPossibleKeys(unknown, objWithPossibleKeysForProject) {
        if (typeof unknown !== 'object')
            throw new ErrorCustomType('typeof unknown !== object');
        if (!unknown)
            throw new ErrorCustomType('!unknown');
        for (const key in unknown) {
            if (!(key in objWithPossibleKeysForProject))
                throw new ErrorCustomType('!(key in objWithPossibleKeysForProject)');
        }
        return true;
    },
    isOptions(unknown, project) {
        if (typeof unknown !== 'object')
            throw new ErrorCustomType('typeof unknown !== object');
        if (!unknown)
            throw new ErrorCustomType('!unknown');
        let key;
        let value; // Иначе ниже в цикле типизация value: any
        for ([key, value] of Object.entries(unknown)) {
            if (key === 'group') {
                throw new ErrorCustomSyntax('Not implemented.');
            }
            else if (key === 'groupFilter') {
                throw new ErrorCustomSyntax('Not implemented.');
            }
            else if (key === 'sort') {
                const sort = value;
                if (!this.isSubsetOfPossibleKeys(sort, project))
                    throw new ErrorCustomType('!Projection.isSubsetOfPossibleKeys(sort, project)');
            }
            else if (key === 'sortNulls') {
                const sortNulls = value;
                if (!this.isSubsetOfPossibleKeys(sortNulls, project))
                    throw new ErrorCustomType('!Projection.isSubsetOfPossibleKeys(sortNulls, project)');
            }
            else if (key === 'limit') {
                const limit = value;
                if (typeof limit !== 'number')
                    throw new ErrorCustomType('typeof limit !== number');
            }
            else if (key === 'offset') {
                const offset = value;
                if (typeof offset !== 'number')
                    throw new ErrorCustomType('typeof offset !== number');
            }
            else {
                throw new ErrorCustomType('not allowed key in unknownObj');
            }
        }
        return true;
    }
});
