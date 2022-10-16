import { ErrorCustomType, ErrorCustomSyntax } from "./error.js"
import { FilterT } from "./filter.js"


export type ProjectionGroupT = 'group' | 'count' | 'sum' | 'avg' | 'max' | 'min'

export type ProjectionSortT = 'asc' | 'des'

export type ProjectionSortNullsT = 'first' | 'last'

export type ProjectionOptionsT<ProjectFields extends keyof DocSchemaProject, DocSchemaProject> = {
  group?: Partial<Record<ProjectFields, ProjectionGroupT>>,
  groupFilter?: FilterT<DocSchemaProject>,
  sort?: Partial<Record<ProjectFields, ProjectionSortT | unknown>>,
  sortNulls?: Partial<Record<ProjectFields, ProjectionSortNullsT | unknown>>,
  limit?: number,
  offset?: number,
}

////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const projectionUtil = Object.freeze({
  isSubsetOfPossibleKeys<UnknownKeys extends keyof ObjWithPossibleKeys, ObjWithPossibleKeys>(
    unknown: unknown, 
    objWithPossibleKeysForProject: ObjWithPossibleKeys
  ): unknown is Record<UnknownKeys, unknown> {
    if (typeof unknown !== 'object') throw new ErrorCustomType('typeof unknown !== object')
    if (!unknown) throw new ErrorCustomType('!unknown')
    
    for (const key in unknown) {
      if (!(key in objWithPossibleKeysForProject))
        throw new ErrorCustomType('!(key in objWithPossibleKeysForProject)')
    }
    return true
  },

  isOptions<ProjectFields extends keyof DocSchemaProject, DocSchemaProject>(
    unknown: unknown,
    project: Record<ProjectFields, unknown>
  ): unknown is ProjectionOptionsT<ProjectFields, DocSchemaProject> {
    if (typeof unknown !== 'object') throw new ErrorCustomType('typeof unknown !== object')
    if (!unknown) throw new ErrorCustomType('!unknown')

    let key: string
    let value: unknown // Иначе ниже в цикле типизация value: any
    for ([key, value] of Object.entries(unknown)) {
      if (key === 'group') {
        throw new ErrorCustomSyntax('Not implemented.')
      } else if (key === 'groupFilter') {
        throw new ErrorCustomSyntax('Not implemented.')

      } else if (key === 'sort') {
        const sort = value
        if (!this.isSubsetOfPossibleKeys(sort, project))
          throw new ErrorCustomType('!Projection.isSubsetOfPossibleKeys(sort, project)')
      } else if (key === 'sortNulls') {
        const sortNulls = value
        if (!this.isSubsetOfPossibleKeys(sortNulls, project))
          throw new ErrorCustomType('!Projection.isSubsetOfPossibleKeys(sortNulls, project)')

      } else if (key === 'limit') {
        const limit = value
        if (typeof limit !== 'number') throw new ErrorCustomType('typeof limit !== number')
      } else if (key === 'offset') {
        const offset = value
        if (typeof offset !== 'number') throw new ErrorCustomType('typeof offset !== number')

      } else {
        throw new ErrorCustomType('not allowed key in unknownObj')
      }
    }

    return true
  }
} as const)
