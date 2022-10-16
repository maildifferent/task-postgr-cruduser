import { ErrorCustomType } from "./error.js";
////////////////////////////////////////////////////////////////////////////////
// Public util.
////////////////////////////////////////////////////////////////////////////////
export function isKeyOfObject(key, obj) {
    return key in obj;
}
export function isObjWithForcedStringSignature(unknown) {
    if (typeof unknown !== 'object')
        throw new ErrorCustomType('typeof unknown !== object');
    if (!unknown)
        throw new ErrorCustomType('!unknown');
    return true;
}
