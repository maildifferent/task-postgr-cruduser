import { AuthorizationT } from "./authorization.js";
import { domainUtil, DomainSchemaT } from "./domain.js";
import { ErrorCustomType } from "./error.js";
import { filterUtil, FilterT } from "./filter.js";
import { projectionUtil, ProjectionOptionsT } from "./projection.js";


export interface ModelOptionsI {
  auth?: AuthorizationT
}

////////////////////////////////////////////////////////////////////////////////
// Model. Read. Init.
////////////////////////////////////////////////////////////////////////////////
abstract class ModelRInit<
  DocSchemaMain,
  DocSchemaProject,
  DocSchemaFilter
> {
  protected readonly tabExpression: string
  readonly domSchemaMain: DomainSchemaT<DocSchemaMain>
  readonly domSchemaProject: DomainSchemaT<DocSchemaProject>
  readonly domSchemaFilter: DomainSchemaT<DocSchemaFilter>

  constructor(
    tabExpression: string,
    domSchemaMain: DomainSchemaT<DocSchemaMain>,
    domSchemaProject: DomainSchemaT<DocSchemaProject>,
    domSchemaFilter: DomainSchemaT<DocSchemaFilter>,
  ) {
    this.tabExpression = tabExpression
    this.domSchemaMain = domSchemaMain
    this.domSchemaProject = domSchemaProject
    this.domSchemaFilter = domSchemaFilter
  }
}

////////////////////////////////////////////////////////////////////////////////
// Model. Untyped interfaces.
////////////////////////////////////////////////////////////////////////////////
export abstract class ModelRUntypedInterface {
  abstract readToDocsUntyped(
    filter: unknown,
    project: unknown,
    projectOptions: unknown,
    options?: ModelOptionsI
  ): Promise<unknown[]>
}

export abstract class ModelRWUntypedInterface extends ModelRUntypedInterface {
  abstract createUntyped(
    create: unknown,
    project: unknown,
    options?: ModelOptionsI
  ): Promise<unknown[]>

  abstract deleteUntyped(
    filter: unknown,
    project: unknown,
    options?: ModelOptionsI
  ): Promise<unknown[]>
}

////////////////////////////////////////////////////////////////////////////////
// Model. Main.
////////////////////////////////////////////////////////////////////////////////
export abstract class ModelR<
  DocSchemaMain,
  DocSchemaProject,
  DocSchemaFilter
> extends ModelRInit<
  DocSchemaMain,
  DocSchemaProject,
  DocSchemaFilter
> implements ModelRUntypedInterface {
  async readToDocsUntyped(
    filter: unknown,
    project: unknown,
    projectOptions: unknown,
    options?: ModelOptionsI
  ): Promise<unknown[]> {
    if (!filterUtil.isValid(filter, this.domSchemaFilter))
      throw new ErrorCustomType('!Filter.isValid(filter, this.domSchemaFilter)')

    if (project === '*') {
      project = this.domSchemaProject
    }
    if (!projectionUtil.isSubsetOfPossibleKeys(project, this.domSchemaProject))
      throw new ErrorCustomType('!projection.isSubsetOfPossibleKeys(project, this.domSchemaProject)')

    if (!projectionUtil.isOptions(projectOptions, project))
      throw new ErrorCustomType('!projection.isOptions(projectOptions, project)')

    return this.readToDocs(filter, project, projectOptions, options)
  }

  abstract readToDocs<ProjectFields extends keyof DocSchemaProject>(
    filter: FilterT<DocSchemaFilter>,
    project: Record<ProjectFields, unknown>,
    projectOptions: ProjectionOptionsT<ProjectFields, DocSchemaProject>,
    options?: ModelOptionsI
  ): Promise<Pick<DocSchemaProject, ProjectFields>[]>
}

export abstract class ModelRW<
  DocSchemaMain,
  DocSchemaProject,
  DocSchemaFilter,
  DocSchemaCreate
> extends ModelR<
  DocSchemaMain,
  DocSchemaProject,
  DocSchemaFilter
> implements ModelRWUntypedInterface {
  readonly domSchemaCreate: DomainSchemaT<DocSchemaCreate>

  constructor(
    tabExpression: string,
    domSchemaMain: DomainSchemaT<DocSchemaMain>,
    domSchemaProject: DomainSchemaT<DocSchemaProject>,
    domSchemaFilter: DomainSchemaT<DocSchemaFilter>,
    domSchemaCreate: DomainSchemaT<DocSchemaCreate>,
  ) {
    super(
      tabExpression,
      domSchemaMain,
      domSchemaProject,
      domSchemaFilter
    )
    this.domSchemaCreate = domSchemaCreate
  }

  async createUntyped(
    create: unknown,
    project: unknown,
    options?: ModelOptionsI
  ): Promise<unknown[]> {
    if (!domainUtil.isDocSchemaRequiredArr(create, this.domSchemaCreate)) {
      throw new ErrorCustomType('!Domain.isDocSchemaRequiredArr(this.domSchemaCreate, create)')
    }
    if (!projectionUtil.isSubsetOfPossibleKeys(project, this.domSchemaProject)) {
      throw new ErrorCustomType('!projection.isSubsetOfPossibleKeys(project, this.domSchemaProject)')
    }

    return this.create(create, project, options)
  }

  abstract create<ProjectFields extends keyof DocSchemaProject>(
    create: (DocSchemaCreate)[],
    project: Record<ProjectFields, unknown>,
    options?: ModelOptionsI
  ): Promise<Pick<DocSchemaProject, ProjectFields>[]>

  async deleteUntyped(
    filter: unknown,
    project: unknown,
    options?: ModelOptionsI
  ): Promise<unknown[]> {
    if (!filterUtil.isValid(filter, this.domSchemaFilter))
      throw new ErrorCustomType('!Filter.isValid(filter, this.domSchemaFilter)')

    if (project === '*') {
      project = this.domSchemaProject
    }
    if (!projectionUtil.isSubsetOfPossibleKeys(project, this.domSchemaProject))
      throw new ErrorCustomType('!projection.isSubsetOfPossibleKeys(project, this.domSchemaProject)')

    return this.delete(filter, project, options)
  }

  abstract delete<ProjectFields extends keyof DocSchemaProject>(
    filter: FilterT<DocSchemaFilter>,
    project: Record<ProjectFields, unknown>,
    options?: ModelOptionsI
  ): Promise<Pick<DocSchemaProject, ProjectFields>[]>
}
