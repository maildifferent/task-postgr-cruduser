import { isObjWithForcedStringSignature } from './util.js';
////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export class DriverFrontModelR {
    model;
    constructor(model) {
        this.model = model;
    }
    read = async (req, res) => {
        try {
            let filter = driverFront.getLinkDataFromReq(req);
            if (!filter)
                filter = req.body['filter'] || {};
            const project = req.body['project'] || '*';
            const projectOptions = req.body['projectOptions'] || {};
            const modelOptinos = {};
            if (req.auth)
                modelOptinos.auth = req.auth;
            const queryRes = await this.model.readToDocsUntyped(filter, project, projectOptions, modelOptinos);
            return driverFront.response(res, queryRes);
        }
        catch (error) {
            return driverFront.responseErr(res, 500, error);
        }
    };
}
export class DriverFrontModelRW extends DriverFrontModelR {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    create = async (req, res) => {
        try {
            const create = req.body['create'] || {};
            const project = req.body['project'] || {};
            const modelOptions = {};
            if (req.auth)
                modelOptions.auth = req.auth;
            const queryRes = await this.model.createUntyped(create, project, modelOptions);
            return driverFront.response(res, queryRes);
        }
        catch (error) {
            return driverFront.responseErr(res, 500, error);
        }
    };
    delete = async (req, res) => {
        try {
            let filter = driverFront.getLinkDataFromReq(req);
            if (!filter)
                filter = req.body['filter'] || {};
            const project = req.body['project'] || '*';
            const modelOptinos = {};
            if (req.auth)
                modelOptinos.auth = req.auth;
            const queryRes = await this.model.deleteUntyped(filter, project, modelOptinos);
            return driverFront.response(res, queryRes);
        }
        catch (error) {
            return driverFront.responseErr(res, 500, error);
        }
    };
}
////////////////////////////////////////////////////////////////////////////////
// Public util.
////////////////////////////////////////////////////////////////////////////////
export const driverFront = Object.freeze({
    CONSTS: {
        data: 'data'
    },
    response(res, result) {
        const response = { ok: true, result };
        res.json(response);
    },
    responseErr(res, status, error) {
        console.error(error);
        let message = '';
        if (isObjWithForcedStringSignature(error)) {
            const value = error['message'];
            if (typeof value === 'string')
                message = value;
        }
        const responseErr = { ok: false, error: message || error };
        return res.status(status).json(responseErr);
    },
    getLinkDataFromReq(req) {
        let unknown;
        unknown = req.params;
        if (typeof unknown === 'object' && unknown !== null && Object.keys(unknown).length > 0)
            return unknown;
        unknown = req.query;
        if (typeof unknown === 'object' && unknown !== null && Object.keys(unknown).length > 0)
            return unknown;
        return;
    }
});
////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////
