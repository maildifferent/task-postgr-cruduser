import { ErrorCustomType } from "./error.js"


////////////////////////////////////////////////////////////////////////////////
// Public util.
////////////////////////////////////////////////////////////////////////////////
export function isKeyOfObject<T>(key: any, obj: T): key is keyof T {
  return key in obj;
}

export function isObjWithForcedStringSignature(unknown: unknown): unknown is Record<string, unknown> {
  if (typeof unknown !== 'object') throw new ErrorCustomType('typeof unknown !== object')
  if (!unknown) throw new ErrorCustomType('!unknown')
  return true
}
