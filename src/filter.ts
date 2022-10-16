import { domainUtil, DomainI, DomainSchemaT } from "./domain.js";
import { ErrorCustomSyntax, ErrorCustomType } from "./error.js";
import { isKeyOfObject } from "./util.js";


////////////////////////////////////////////////////////////////////////////////
// Операнды, которые используем в filter query.
////////////////////////////////////////////////////////////////////////////////
export type FilterComparisonOperandT<Operand> = {
  $eq?: Operand;
  $ne?: Operand;
  $in?: Operand[];
  $nin?: Operand[];
  $gt?: Operand;
  $gte?: Operand;
  $lt?: Operand;
  $lte?: Operand;
}

////////////////////////////////////////////////////////////////////////////////
// Определение фильтра.
////////////////////////////////////////////////////////////////////////////////
export type FilterValueT<T> = T
  | FilterComparisonOperandT<T>
  | Array<FilterComparisonOperandT<T>>

export type FilterT<DocSchema> = {
  [key in keyof DocSchema]?: FilterValueT<DocSchema[key]>
}

// Пример.
{
  interface MaterialI {
    qty: number;
    saleFlag: boolean;
    price: number;
  }
  const filter: FilterT<MaterialI> = {
    qty: [  // implicit OR
      { $gt: 10, $lt: 20, $in: [13, 15] },
      { $gt: 20, $lt: 30 }, // implicit AND
    ],
    saleFlag: true,
    price: { $lt: 5 },
  }
  filter
}

////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const filterUtil = Object.freeze({
  isValid<DocSchemaFilter>(
    unknown: unknown,
    domSchemaFilter: DomainSchemaT<DocSchemaFilter>,
  ): unknown is FilterT<DocSchemaFilter> {
    if (typeof unknown !== 'object') throw new ErrorCustomType('typeof unknown !== object')
    if (!unknown) throw new ErrorCustomType('!unknown')
    const incorrectFields: string[] = []

    let field: string
    let fieldVal: unknown // Иначе ниже в цикле типизация fieldVal: any
    for ([field, fieldVal] of Object.entries(unknown)) {
      if (!isKeyOfObject(field, domSchemaFilter)) {
        incorrectFields.push(field)
        continue
      }

      const domain = domSchemaFilter[field]
      if (domainUtil.isType(fieldVal, domain)) continue

      if (Array.isArray(fieldVal)) throw new ErrorCustomSyntax('Not implemented: Array.isArray(fieldVal)')

      // На этом этапе должны остаться только варианты типа: {qty: { $lt: 5 }}
      // или {qty: { $gt: 10, $lt: 20, $nin: [13, 15] }}...
      try {
        if (!isComparisonOperand(fieldVal, domain)) incorrectFields.push(field)
      } catch (error) {
        incorrectFields.push(field)
      }
    }

    if (incorrectFields.length > 0) throw new ErrorCustomType(JSON.stringify(['Incorrect fields:', ...incorrectFields]))
    return true
  }
} as const)

////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////
function isComparisonOperand<PrimitiveType>(
  unknown: unknown,
  domain: DomainI<PrimitiveType>
): unknown is FilterComparisonOperandT<PrimitiveType> {
  if (typeof unknown !== 'object') throw new ErrorCustomType('typeof unknown !== object')
  if (!unknown) throw new ErrorCustomType('!unknown')

  let operator: string
  let operand: unknown // Иначе ниже в цикле типизация operand: any
  for ([operator, operand] of Object.entries(unknown)) {
    if (['$eq', '$ne', '$gt', '$lt', '$gte', '$lte'].includes(operator)) {
      if (!domainUtil.isType(operand, domain)) return false
      continue
    }

    if (['$in', '$nin'].includes(operator)) {
      if (!Array.isArray(operand)) return false
      if (operand.length < 1) return false
      let arrayVal: unknown // Иначе ниже в цикле типизация arrayVal: any
      for (arrayVal of operand) {
        if (!domainUtil.isType(arrayVal, domain)) return false
      }
      continue
    }

    // Incorrect operator.
    return false
  }

  return true
}