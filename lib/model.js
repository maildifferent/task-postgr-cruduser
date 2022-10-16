import { domainUtil } from "./domain.js";
import { ErrorCustomType } from "./error.js";
import { filterUtil } from "./filter.js";
import { projectionUtil } from "./projection.js";
////////////////////////////////////////////////////////////////////////////////
// Model. Read. Init.
////////////////////////////////////////////////////////////////////////////////
class ModelRInit {
    tabExpression;
    domSchemaMain;
    domSchemaProject;
    domSchemaFilter;
    constructor(tabExpression, domSchemaMain, domSchemaProject, domSchemaFilter) {
        this.tabExpression = tabExpression;
        this.domSchemaMain = domSchemaMain;
        this.domSchemaProject = domSchemaProject;
        this.domSchemaFilter = domSchemaFilter;
    }
}
////////////////////////////////////////////////////////////////////////////////
// Model. Untyped interfaces.
////////////////////////////////////////////////////////////////////////////////
export class ModelRUntypedInterface {
}
export class ModelRWUntypedInterface extends ModelRUntypedInterface {
}
////////////////////////////////////////////////////////////////////////////////
// Model. Main.
////////////////////////////////////////////////////////////////////////////////
export class ModelR extends ModelRInit {
    async readToDocsUntyped(filter, project, projectOptions, options) {
        if (!filterUtil.isValid(filter, this.domSchemaFilter))
            throw new ErrorCustomType('!Filter.isValid(filter, this.domSchemaFilter)');
        if (project === '*') {
            project = this.domSchemaProject;
        }
        if (!projectionUtil.isSubsetOfPossibleKeys(project, this.domSchemaProject))
            throw new ErrorCustomType('!projection.isSubsetOfPossibleKeys(project, this.domSchemaProject)');
        if (!projectionUtil.isOptions(projectOptions, project))
            throw new ErrorCustomType('!projection.isOptions(projectOptions, project)');
        return this.readToDocs(filter, project, projectOptions, options);
    }
}
export class ModelRW extends ModelR {
    domSchemaCreate;
    constructor(tabExpression, domSchemaMain, domSchemaProject, domSchemaFilter, domSchemaCreate) {
        super(tabExpression, domSchemaMain, domSchemaProject, domSchemaFilter);
        this.domSchemaCreate = domSchemaCreate;
    }
    async createUntyped(create, project, options) {
        if (!domainUtil.isDocSchemaRequiredArr(create, this.domSchemaCreate)) {
            throw new ErrorCustomType('!Domain.isDocSchemaRequiredArr(this.domSchemaCreate, create)');
        }
        if (!projectionUtil.isSubsetOfPossibleKeys(project, this.domSchemaProject)) {
            throw new ErrorCustomType('!projection.isSubsetOfPossibleKeys(project, this.domSchemaProject)');
        }
        return this.create(create, project, options);
    }
    async deleteUntyped(filter, project, options) {
        if (!filterUtil.isValid(filter, this.domSchemaFilter))
            throw new ErrorCustomType('!Filter.isValid(filter, this.domSchemaFilter)');
        if (project === '*') {
            project = this.domSchemaProject;
        }
        if (!projectionUtil.isSubsetOfPossibleKeys(project, this.domSchemaProject))
            throw new ErrorCustomType('!projection.isSubsetOfPossibleKeys(project, this.domSchemaProject)');
        return this.delete(filter, project, options);
    }
}
