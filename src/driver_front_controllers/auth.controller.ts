import express from 'express'
import { driverFront } from "../driver_front.js"
import { authorization } from '../authorization.js'
import { ErrorCustomSyntax, ErrorCustomType } from '../error.js'


////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const driverFrontAuthorizationController: {
  authProtect: express.RequestHandler,
  signin: express.RequestHandler,
  login: express.RequestHandler
} = ({
  async authProtect(req, res, next) {
    const retF = (status: number, error: any) => { return driverFront.responseErr(res, status, error) }
    try {
      const token = getTokenFromRequest(req)
      const verifyTokenRes = await authorization.verifyTokenAsync(token)
      if ('auth' in req) throw new ErrorCustomSyntax('auth in req')
      req.auth = verifyTokenRes
      return next()
    } catch (error) {
      return retF(401, error)
    }
  },

  async signin(req, res) {
    const retF = (status: number, error: any) => { return driverFront.responseErr(res, status, error) }
    try {
      let unknown: unknown = driverFront.getLinkDataFromReq(req)
      if (!unknown) unknown = req.body[driverFront.CONSTS.data]
      const loginRes = await authorization.signinUntyped(unknown)
      return res.json({ ok: true, result: loginRes })
    } catch (error) {
      return retF(500, error)
    }
  },

  async login(req, res) {
    const retF = (status: number, error: any) => { return driverFront.responseErr(res, status, error) }
    try {
      let unknown: unknown = driverFront.getLinkDataFromReq(req)
      if (!unknown) unknown = req.body[driverFront.CONSTS.data]
      if (typeof unknown !== 'object') throw new ErrorCustomType('typeof unknown !== object')
      const { password, ...user } = { password: undefined, ...unknown }
      const loginRes = await authorization.loginUntyped(user, password)
      return res.json({ ok: true, result: loginRes })
    } catch (error) {
      return retF(401, error)
    }
  }
} as const)

////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////
function getTokenFromRequest(req: express.Request): string {
  if (!req || !req.headers || !req.headers.authorization) throw new ErrorCustomType('!req || !req.headers || !req.headers.authorization')
  if (!req.headers.authorization.startsWith('Bearer ')) throw new ErrorCustomType('!req.headers.authorization.startsWith(Bearer )')

  const token = req.headers.authorization.split(' ')[1]
  if (typeof token !== 'string') throw new ErrorCustomType('typeof token !== string')
  return token
}