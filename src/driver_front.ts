import express from 'express';
import { AuthorizationT } from './authorization.js';
import { ModelOptionsI, ModelRUntypedInterface, ModelRWUntypedInterface } from './model.js'
import { isObjWithForcedStringSignature } from './util.js';


declare global {
  namespace Express {
    interface Request {
      auth?: AuthorizationT
    }
  }
}

export interface DriverFrontResponseErrorI {
  ok: false
  error: any
}

export type DriverFrontResponseT<Result> = {
  ok: true
  result: Result
}

////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export class DriverFrontModelR {
  protected readonly model: ModelRUntypedInterface

  constructor(model: ModelRUntypedInterface) {
    this.model = model
  }

  read: express.RequestHandler = async (req, res) => {
    try {
      let filter: unknown = driverFront.getLinkDataFromReq(req)
      if (!filter) filter = req.body['filter'] || {}
      const project: unknown = req.body['project'] || '*'
      const projectOptions: unknown = req.body['projectOptions'] || {}

      const modelOptinos: ModelOptionsI = {}
      if (req.auth) modelOptinos.auth = req.auth

      const queryRes = await this.model.readToDocsUntyped(filter, project, projectOptions, modelOptinos);
      return driverFront.response(res, queryRes)
    } catch (error) {
      return driverFront.responseErr(res, 500, error)
    }
  }
}

export class DriverFrontModelRW extends DriverFrontModelR {
  protected override readonly model: ModelRWUntypedInterface

  constructor(model: ModelRWUntypedInterface) {
    super(model)
    this.model = model
  }

  create: express.RequestHandler = async (req, res) => {
    try {
      const create: unknown = req.body['create'] || {}
      const project: unknown = req.body['project'] || {}

      const modelOptions: ModelOptionsI = {}
      if (req.auth) modelOptions.auth = req.auth

      const queryRes = await this.model.createUntyped(create, project, modelOptions);
      return driverFront.response(res, queryRes)
    } catch (error) {
      return driverFront.responseErr(res, 500, error)
    }
  }

  delete: express.RequestHandler = async (req, res) => {
    try {
      let filter: unknown = driverFront.getLinkDataFromReq(req)
      if (!filter) filter = req.body['filter'] || {}
      const project: unknown = req.body['project'] || '*'

      const modelOptinos: ModelOptionsI = {}
      if (req.auth) modelOptinos.auth = req.auth

      const queryRes = await this.model.deleteUntyped(filter, project, modelOptinos);
      return driverFront.response(res, queryRes)
    } catch (error) {
      return driverFront.responseErr(res, 500, error)
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// Public util.
////////////////////////////////////////////////////////////////////////////////
export const driverFront = Object.freeze({
  CONSTS: {
    data: 'data'
  },

  response(res: express.Response, result: unknown) {
    const response: DriverFrontResponseT<typeof result> = { ok: true, result }
    res.json(response)
  },

  responseErr(res: express.Response, status: number, error: unknown) {
    console.error(error)
    let message: string = ''
    if (isObjWithForcedStringSignature(error)) {
      const value = error['message']
      if (typeof value === 'string') message = value
    }

    const responseErr: DriverFrontResponseErrorI = { ok: false, error: message || error };
    return res.status(status).json(responseErr);
  },

  getLinkDataFromReq(req: express.Request): unknown {
    let unknown: unknown
    unknown = req.params
    if (typeof unknown === 'object' && unknown !== null && Object.keys(unknown).length > 0) return unknown
    unknown = req.query
    if (typeof unknown === 'object' && unknown !== null && Object.keys(unknown).length > 0) return unknown

    return
  }
} as const)

////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////

