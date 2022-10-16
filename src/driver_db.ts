import pg from 'pg'
import { AuthorizationT } from './authorization.js'
import { DocSchemaValTypesT, docSchemaUtil } from './doc_schema.js'
import { domainUtil, DomainSchemaT } from './domain.js'
import { ErrorCustomAuthorization, ErrorCustomType, ErrorCustomSyntax } from './error.js'
import { FilterT } from './filter.js'
import { ProjectionOptionsT } from './projection.js'
import { isKeyOfObject } from './util.js'


const pgPool = new pg.Pool({
  user: 'postgres',
  password: '12345678',
  host: 'localhost',
  port: 5432,
  database: 'task_tag_crud'
})

interface DriverDbOptions {
  auth?: AuthorizationT
}

////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
class DriverDb {
  protected transaction?: DriverDBTransaction

  async dbCreate<
    ProjectFields extends keyof DocSchemaProject, DocSchemaProject, DocSchemaCreate
  >(
    tabExpression: string,
    domSchemaCreate: DomainSchemaT<DocSchemaCreate>,
    domSchemaProject: DomainSchemaT<DocSchemaProject>,
    create: (DocSchemaCreate)[],
    project: Record<ProjectFields, unknown>,
    options?: DriverDbOptions
  ): Promise<Pick<DocSchemaProject, ProjectFields>[]> {
    if (this.transaction) throw new ErrorCustomSyntax('DriverDb.transaction is not implemented.')

    if (!options || !options.auth) throw new ErrorCustomAuthorization('!options || !options.auth')

    // Validate.
    for (const doc of create) {
      domainUtil.applyDomainValidatorToDoc(domSchemaCreate, doc)
    }

    // Create query construction blocks.
    const { queryFields, queryValsTab } = createQueryFromDocArr(create)

    // Convert query values.
    for (const queryValsRow of queryValsTab) {
      await processQueryValsByDomainConverter(domSchemaCreate, queryFields, queryValsRow)
    }

    // Build query.
    let index = 1
    // Массив строк: ['$1, $2, $3', '$4, $5, $6', ...]
    const valuesQueryTextArr = queryValsTab.map((row) => { return row.map(() => `$${index++}`).join(', ') })
    // Строка: '($1, $2, $3), ($4, $5, $6), ...'
    let valuesQueryText = '(' + valuesQueryTextArr.join('), (') + ')'

    // INSERT INTO tagstab (creator, name, sortorder) VALUES ($1, $2, $3), ($4, $5, $6) RETURNING id, creator...
    let queryText = 'INSERT INTO ' + tabExpression + ' (' + queryFields.join(', ') + ')'
      + ' VALUES ' + valuesQueryText
    const projectKeys = Object.keys(project)
    if (projectKeys.length > 0) queryText += ' RETURNING ' + projectKeys.join(', ')

    const queryVals: DocSchemaValTypesT[] = []
    for (const row of queryValsTab) for (const elem of row) queryVals.push(elem);

    return pgPool_query<ProjectFields, DocSchemaProject>(
      domSchemaProject, queryText, queryVals, project
    )
  }

  async dbReadToDocs<
    ProjectFields extends keyof DocSchemaProject, DocSchemaProject, DocSchemaFilter
  >(
    tabExpression: string,
    domSchemaFilter: DomainSchemaT<DocSchemaFilter>,
    domSchemaProject: DomainSchemaT<DocSchemaProject>,
    filter: FilterT<DocSchemaFilter>,
    project: Record<ProjectFields, unknown>,
    projectOptions: ProjectionOptionsT<ProjectFields, DocSchemaProject>,
    options?: DriverDbOptions
  ): Promise<Pick<DocSchemaProject, ProjectFields>[]> {
    if (this.transaction) throw new ErrorCustomSyntax('DriverDb.transaction is not implemented.')

    if (!options || !options.auth) throw new ErrorCustomAuthorization('!options || !options.auth')

    // Create query construction blocks.
    const { query, queryFields, queryVals } = createQueryFromFilter(filter)

    // Convert query values.
    await processQueryValsByDomainConverter(domSchemaFilter, queryFields, queryVals)

    // Projection options.
    const pOptions: ProjectionOptionsT<ProjectFields, DocSchemaProject> = projectOptions || {}
    const sortExpression: string = createSortExpression(pOptions, project)

    // Build query.
    // SELECT id, creator FROM tagstab WHERE id=$1 AND creator IN ($2, $3, ...)
    // SELECT product_id, p.name, (sum(s.units) * (p.price - p.cost)) AS profit
    //    FROM products p LEFT JOIN sales s USING (product_id)
    //    WHERE s.date > CURRENT_DATE - INTERVAL '4 weeks'
    //    GROUP BY product_id, p.name, p.price, p.cost
    //    HAVING sum(p.price * s.units) > 5000;
    // SELECT a + b AS sum, c FROM table1 ORDER BY sum, c DESC NULLS LAST LIMIT 20 OFFSET 10
    // SELECT * FROM (VALUES (1, 'one'), (2, 'two'), (3, 'three')) AS t (num,letter);
    let queryText = 'SELECT ' + Object.keys(project).join(', ') + ' FROM ' + tabExpression
    if (query) queryText += ' WHERE ' + query
    if (sortExpression) queryText += ' ORDER BY ' + sortExpression
    if (pOptions.offset) queryText += ' OFFSET ' + pOptions.offset
    if (pOptions.limit) queryText += ' LIMIT ' + pOptions.limit

    return pgPool_query<ProjectFields, DocSchemaProject>(
      domSchemaProject, queryText, queryVals, project
    )
  }

  async delete<
    ProjectFields extends keyof DocSchemaProject, DocSchemaProject, DocSchemaFilter
  >(
    tabExpression: string,
    domSchemaFilter: DomainSchemaT<DocSchemaFilter>,
    domSchemaProject: DomainSchemaT<DocSchemaProject>,
    filter: FilterT<DocSchemaFilter>,
    project: Record<ProjectFields, unknown>,
    options?: DriverDbOptions
  ): Promise<Pick<DocSchemaProject, ProjectFields>[]> {
    if (this.transaction) throw new ErrorCustomSyntax('DriverDb.transaction is not implemented.')

    if (!options || !options.auth) throw new ErrorCustomAuthorization('!options || !options.auth')

    // Create query construction blocks.
    const { query, queryFields, queryVals } = createQueryFromFilter(filter)

    // Convert query values.
    await processQueryValsByDomainConverter(domSchemaFilter, queryFields, queryVals)

    // Build query.
    // DELETE FROM tagstab WHERE id=$1 AND creator=$2 AND ... RETURNING *;
    let queryText = 'DELETE FROM ' + tabExpression
    if (!query) throw new ErrorCustomType('!query')
    queryText += ' WHERE ' + query
    const projectKeys = Object.keys(project)
    if (projectKeys.length > 0) queryText += ' RETURNING ' + projectKeys.join(', ')

    return pgPool_query<ProjectFields, DocSchemaProject>(
      domSchemaProject, queryText, queryVals, project
    )
  }
}

export const driverDb = new DriverDb()

// Transaction functionality not implemented.
export class DriverDBTransaction extends DriverDb {
  constructor() {
    super()
    this.transaction = this
  }
}

////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////
function createSortExpression<ProjectFields extends keyof DocSchemaProject, DocSchemaProject>(
  projectOptions: ProjectionOptionsT<ProjectFields, DocSchemaProject>,
  project: Record<ProjectFields, unknown>
): string {
  const projectSort = projectOptions.sort
  const projectSortNulls = projectOptions.sortNulls
  // Пример: ['name', 'age DESC NULLS LAST', 'gender DESC']
  let sortExpressionArr: string[] = []

  for (const key in project) {
    let field: string = ''
    let sortToken: string = ''
    if (projectSort) {
      field = key
      const sort = projectSort[key]
      if (sort === 'des') { sortToken = ' DESC' }
      else if (sort === 'asc') { sortToken = ' ASC' }
    }
    if (projectSortNulls) {
      field = key
      const sortNulls = projectSortNulls[key]
      if (sortNulls === 'last') { sortToken += ' NULLS LAST' }
      else if (sortNulls === 'first') { sortToken += ' NULLS FIRST' }
    }
    if (field) sortExpressionArr.push(field + sortToken)
  }

  //Пример: ORDER BY name, age DESC NULLS LAST, gender DESC
  return sortExpressionArr.join(', ')
}

async function processQueryValsByDomainConverter<DocSchema>(
  domSchema: DomainSchemaT<DocSchema>,
  queryFields: string[],
  queryValsChanging: DocSchemaValTypesT[]
): Promise<void> {
  if (queryFields.length !== queryValsChanging.length) throw new ErrorCustomSyntax('queryFields.length !== queryValsChanging.length')

  for (let i = 0; i < queryValsChanging.length; i++) {
    const fieldName = queryFields[i]
    if (fieldName === undefined) throw new ErrorCustomSyntax('fieldName === undefined')
    if (!isKeyOfObject(fieldName, domSchema)) throw new ErrorCustomSyntax('!isKeyOfObject(fieldName, domSchema)')

    const domain = domSchema[fieldName]
    if (!domain) throw new ErrorCustomSyntax('!domain')
    if (!domain.convert) continue

    const oldValue = queryValsChanging[i]
    if (oldValue === undefined) throw new ErrorCustomSyntax('oldValue === undefined')
    if (!domainUtil.isType(oldValue, domain)) throw new ErrorCustomSyntax('!Domain.isType(domain, oldValue)')

    const newVal = await domain.convert(oldValue)
    if (!docSchemaUtil.isValidFieldValueType(newVal)) throw new ErrorCustomSyntax('!Document.isDocSchemaValTypes(newVal)')
    queryValsChanging[i] = newVal
  }
}

async function pgPool_query<
  ProjectFields extends keyof DocSchemaProject, DocSchemaProject
>(
  domSchemaProject: DomainSchemaT<DocSchemaProject>,
  queryText: string,
  queryVals: DocSchemaValTypesT[],
  project: Record<ProjectFields, unknown>
): Promise<Pick<DocSchemaProject, ProjectFields>[]> {
  const queryRes = await pgPool.query(queryText, queryVals)

  const rows: unknown[] = queryRes.rows
  if (!domainUtil.isDocSchemaExtractArr<ProjectFields, DocSchemaProject>(
    rows, project, domSchemaProject
  )) throw new ErrorCustomType('!Domain.isDocSchemaExtractArr<ProjectFields, DocSchemaProject>(domSchemaProject, project, rows)')

  return rows
}

function createQueryFromDocArr<DocSchema>(
  docs: DocSchema[]
): { queryFields: string[]; queryValsTab: DocSchemaValTypesT[][] } {
  let queryFields: string[] = []
  const queryValsTab: DocSchemaValTypesT[][] = []
  if (docs.length < 1) return { queryFields, queryValsTab }

  const doc0 = docs[0]
  if (!doc0) throw new ErrorCustomSyntax('!doc0')
  queryFields = Object.keys(doc0)
  if (queryFields.length < 1) return { queryFields, queryValsTab }

  for (const doc of docs) {
    if (typeof doc !== 'object') throw new ErrorCustomType('typeof doc !== object')
    if (!doc) throw new ErrorCustomType('!doc')

    if (Object.keys(doc).length !== queryFields.length) throw new ErrorCustomType('Object.keys(doc).length !== queryFields.length')

    const queryValsLine: DocSchemaValTypesT[] = []
    queryValsTab.push(queryValsLine)

    for (const field of queryFields) {
      if (!isKeyOfObject(field, doc)) throw new ErrorCustomType('!isKeyOfObject(field, doc)')

      const value = doc[field]
      if (value === undefined) throw new ErrorCustomType('value === undefined')

      if (!docSchemaUtil.isValidFieldValueType(value)) throw new ErrorCustomType('!Document.isDocSchemaValTypes(value)')
      queryValsLine.push(value)
    }
  }

  return { queryFields, queryValsTab }
}

////////////////////////////////////////////////////////////////////////////////
// Filter.
////////////////////////////////////////////////////////////////////////////////
const FILTER_OPERATORS_MAP_TO_SQL = Object.freeze({
  $eq: '=',
  $ne: '!=',
  $in: 'IN',
  $nin: 'NOT IN',
  // $regex: '$regex',
  $gt: '>',
  $gte: '>=',
  $lt: '<',
  $lte: '<=',
} as const)

const FILTER_OPERATORS_MAP_TO_SQL_: Record<string, string> = { ...FILTER_OPERATORS_MAP_TO_SQL }

// filterToQuery
// qty: [{ $gt: 10, $lt: 20, $in: [13, 15] }, { $gt: 20, $lt: 30 }]
// =>
// '( (qty >= 10 AND qty <= 20 AND qty IN (13,15)) OR (qty >= 20 AND qty <= 30) ) AND ... '
// =>
// '( (qty >= $1 AND qty <= $2 AND qty IN ($3,$4)) OR (qty >= $5 AND qty <= $6) ) AND ... '
function createQueryFromFilter(
  filter: FilterT<Record<string, unknown>>
): { query: string; queryFields: string[], queryVals: DocSchemaValTypesT[] } {
  const incorrectFields: string[] = []
  const queryFields: string[] = []
  const queryVals: DocSchemaValTypesT[] = []
  const queryAndArr: string[] = []

  for (const [field, fieldVal] of Object.entries(filter)) {
    if (fieldVal === undefined) continue

    if (docSchemaUtil.isValidFieldValueType(fieldVal)) {
      queryVals.push(fieldVal)
      queryFields.push(field)
      queryAndArr.push(field + ' = $' + queryVals.length)
      continue
    }

    if (typeof fieldVal !== 'object') {
      incorrectFields.push(field)
      continue
    }

    if (Array.isArray(fieldVal)) throw new ErrorCustomSyntax('Not implemented.')

    // На этом этапе должны остаться только варианты типа: {qty: { $lt: 5 }} или
    // {qty: { $gt: 10, $lt: 20, $nin: [13, 15] }}...
    const fieldOperationsArr: string[] = []
    let operator: string
    let operand: unknown
    for ([operator, operand] of Object.entries(fieldVal)) {
      const operatorSQL: string | undefined = FILTER_OPERATORS_MAP_TO_SQL_[operator]
      if (!operatorSQL) {
        incorrectFields.push(field)
        break
      }

      if (['$eq', '$ne', '$gt', '$lt', '$gte', '$lte'].includes(operator)) {
        if (!docSchemaUtil.isValidFieldValueType(operand)) {
          incorrectFields.push(field)
          break
        }
        queryVals.push(operand)
        if (queryFields) queryFields.push(field)
        fieldOperationsArr.push(field + ' ' + operatorSQL + ' $' + queryVals.length)
        continue
      }

      if (['$in', '$nin'].includes(operator)) {
        if (!Array.isArray(operand)) {
          incorrectFields.push(field)
          break
        }

        const inOperandVals: string[] = []
        let arrayVal: unknown
        for (arrayVal of operand) {
          if (!docSchemaUtil.isValidFieldValueType(arrayVal)) {
            incorrectFields.push(field)
            break
          }
          queryVals.push(arrayVal)
          if (queryFields) queryFields.push(field)
          inOperandVals.push('$' + queryVals.length)
        }
        fieldOperationsArr.push(field + ' ' + operatorSQL + ' (' + inOperandVals.join(',') + ') ')
        continue
      }

      // Incorrect operator.
      incorrectFields.push(field)
    }
    const queryAndItem: string = '(' + fieldOperationsArr.join(' AND ') + ')'
    queryAndArr.push(queryAndItem)
  }

  if (incorrectFields.length > 0) throw new ErrorCustomType(JSON.stringify(['Incorrect fields:', ...incorrectFields]))
  if (queryFields && queryFields.length !== queryVals.length) throw new ErrorCustomSyntax('queryFields && queryFields.length !== queryVals.length')

  const query: string = queryAndArr.join(' AND ')
  return { query, queryFields, queryVals }
}