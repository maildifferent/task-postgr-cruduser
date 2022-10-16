import { ErrorCustomType } from "./error.js"
import { isObjWithForcedStringSignature } from "./util.js"


export interface DomainI<PrimitiveType> {
  type: string extends PrimitiveType ? 'string'
  : number extends PrimitiveType ? 'number'
  : boolean extends PrimitiveType ? 'boolean'
  : bigint extends PrimitiveType ? 'bigint'
  : never
  isNullable: null extends PrimitiveType ? true : false
  isOptional?: undefined extends PrimitiveType ? true : false
  isNotReadable?: boolean // Default = false.
  validate: (value: PrimitiveType) => boolean
  convert?: (value: PrimitiveType) => Promise<PrimitiveType>
}

////////////////////////////////////////////////////////////////////////////////
// Domain schema.
////////////////////////////////////////////////////////////////////////////////
export type DomainSchemaT<DocSchema> = {
  [key in keyof DocSchema]: DomainI<DocSchema[key]>
}

////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const domainUtil = Object.freeze({
  isType<PrimitiveType>(
    unknown: unknown,
    domain: DomainI<PrimitiveType>
  ): unknown is PrimitiveType {
    if (domain.isNullable && unknown === null) return true
    return (typeof unknown === domain.type)
  },

  applyDomainValidatorToDoc<DocSchema>(
    domSchema: DomainSchemaT<DocSchema>, doc: DocSchema
  ): void {
    const incorrectFields: string[] = []

    for (const key in domSchema) {
      const domain = domSchema[key]
      const docVal = doc[key]
      if (docVal === undefined) {
        if (domain.isOptional) continue
        incorrectFields.push(key)
        continue
      }

      try {
        if (!domain.validate(docVal)) { incorrectFields.push(key) }
      } catch (error) {
        if (error instanceof ErrorCustomType) incorrectFields.push(key)
        throw error
      }
    }

    if (incorrectFields.length > 0)
      throw new ErrorCustomType(JSON.stringify(['Incorrect fields:', ...incorrectFields]))
  },

  // Далее методы, которые проверяют, что: либо объект, либо экстракт из свойств
  // объекта, либо массив объектов или экстрактов соответствуют настройкам,
  // заложенным в доменной схеме.
  isDocSchemaExtract<
    ExtractFields extends keyof DocSchemaAll, DocSchemaAll
  >(
    unknown: unknown,
    extract: Record<ExtractFields, unknown>,
    domSchemaAll: DomainSchemaT<DocSchemaAll>,
  ): unknown is Pick<DocSchemaAll, ExtractFields> {
    if (!isObjWithForcedStringSignature(unknown)) throw new ErrorCustomType('!forceStringSignature(unknown)')
    for (const key in extract) {
      const domain = domSchemaAll[key]
      if (!domainUtil.isType(unknown[key], domain)) throw new ErrorCustomType('!domainUtil.isType(unknown[key], domain)')
    }

    if (Object.keys(extract).length !== Object.keys(unknown).length) throw new ErrorCustomType(`Object.keys(extract).length !== Object.keys(unknown).length`);

    return true;
  },

  isDocSchemaExtractArr<
    ExtractFields extends keyof DocSchemaAll, DocSchemaAll
  >(
    unknown: unknown,
    extract: Record<ExtractFields, unknown>,
    domSchemaAll: DomainSchemaT<DocSchemaAll>
  ): unknown is Pick<DocSchemaAll, ExtractFields>[] {
    if (!Array.isArray(unknown)) throw new ErrorCustomType('!Array.isArray(unknown)');

    for (let i = 0; i < unknown.length; i++) {
      if (domainUtil.isDocSchemaExtract<ExtractFields, DocSchemaAll>(
        unknown[i], extract, domSchemaAll
      )) continue
      throw new ErrorCustomType('!Domain.isDocSchemaExtractRequired<ExtractFields, DocSchemaAll>(domSchemaAll, extract, unknown[i])');
    }

    return true
  },

  isDocSchemaRequired<DocSchema>(
    unknown: unknown,
    domSchema: DomainSchemaT<DocSchema>
  ): unknown is Required<DocSchema> {
    const res = domainUtil.isDocSchemaExtract<keyof DocSchema, DocSchema>(
      unknown, domSchema, domSchema
    )
    return res
  },

  isDocSchemaRequiredArr<DocSchema>(
    unknown: unknown,
    domSchema: DomainSchemaT<DocSchema>
  ): unknown is Required<DocSchema>[] {
    const res = domainUtil.isDocSchemaExtractArr<keyof DocSchema, DocSchema>(
      unknown, domSchema, domSchema
    )
    return res
  }
} as const);

////////////////////////////////////////////////////////////////////////////////
// Some tests.
////////////////////////////////////////////////////////////////////////////////
() => {
  const testStrDomain: DomainI<string> = {
    type: 'string',
    isNullable: false,
    validate: (val: string | number) => { return true },
    // convert: (val: string | number) => { return val } // Error.
  }
  let test: unknown
  if (domainUtil.isType(test, testStrDomain)) { test } // typeof test === string
}

////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////


