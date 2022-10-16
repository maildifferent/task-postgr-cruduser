export type DocSchemaValTypesT = null | string | number | boolean | bigint;
export type DocSchemaT = Record<string, null | string | number | boolean | bigint>;

////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const docSchemaUtil = Object.freeze({
  isValidFieldValueType(unknown: unknown): unknown is DocSchemaValTypesT {
    return unknown === null
      || typeof unknown === 'string'
      || typeof unknown === 'number'
      || typeof unknown === 'boolean'
      || typeof unknown === 'bigint'
  }
} as const)