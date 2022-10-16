import bcryptjs from "bcryptjs"
import jsonwebtoken from "jsonwebtoken"
import { driverDb } from "./driver_db.js"
import { domainUtil } from "./domain.js"
import { filterUtil, FilterT } from "./filter.js"
import { ModelOptionsI, ModelR } from "./model.js"
import { UserDocSchemaCreateI, UserDocSchemaFilterI, UserDocSchemaMainI, UserDocSchemaProjectI, userModelRW } from "./models/user.model.js"
import { ProjectionOptionsT } from "./projection.js"
import { ErrorCustomSyntax, ErrorCustomType } from "./error.js"
import { config } from "./config.js"


// export type AuthorizationT = Express.Request['auth']
export type AuthorizationT = {
  tokenPayload: AuthorizationTokenPayloadI,
  user: UserDocSchemaProjectI
}

interface AuthorizationTokenPayloadI {
  uid: string
  iat: number
  exp: number
}

type AuthorizationVerifyTokenRes = {
  tokenPayload: AuthorizationTokenPayloadI,
  user: UserDocSchemaProjectI
}

type AuthorizationLoginRes = { token: string, expire: Date }

const AUTHORIZATION: AuthorizationT = {
  tokenPayload: { uid: '', iat: 0, exp: 0 },
  user: { uid: '', email: '', nickname: '' }
}

////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const authorization = Object.freeze({
  async loginUntyped(
    filter: unknown,
    password: unknown
  ): Promise<AuthorizationLoginRes> {
    if (!password || typeof password !== 'string') throw new ErrorCustomType('!password || typeof password !== string')
    if (!filterUtil.isValid(filter, userWithPasswordR.domSchemaFilter)) throw new ErrorCustomType('!Filter.isValid(filter, userWithPasswordR.domSchemaFilter)')
    return authorization.login(filter, password)
  },

  async login(
    filter: FilterT<UserDocSchemaFilterI>,
    password: UserDocSchemaCreateI['password']
  ): Promise<AuthorizationLoginRes> {
    if (Object.keys(filter).length !== 1) throw new ErrorCustomType('Object.keys(filter).length !== 1')

    const users = await userWithPasswordR.readToDocs(
      filter, userWithPasswordR.domSchemaProject, {}, { auth: AUTHORIZATION }
    )

    if (users.length !== 1) throw new ErrorCustomType('users.length !== 1')
    const user0 = users[0]
    if (!user0) throw new ErrorCustomSyntax('!user0')

    const isPasswordCorrect: boolean = await isPasswordCorrectAsync(password, user0.password)
    if (!isPasswordCorrect) throw new ErrorCustomType('!isPasswordCorrect')

    return signTokenWithTimeAsync(user0.uid)
  },

  async signinUntyped(user: unknown): Promise<AuthorizationLoginRes> {
    if (!domainUtil.isDocSchemaRequired(user, userModelRW.domSchemaCreate)) throw new ErrorCustomType('!Domain.isDocSchemaRequired(userModelRW.domSchemaCreate, user)')
    return authorization.signin(user)
  },

  async signin(user: UserDocSchemaCreateI): Promise<AuthorizationLoginRes> {
    const users = await userModelRW.create([user], userModelRW.domSchemaProject, { auth: AUTHORIZATION })
    if (users.length !== 1) throw new ErrorCustomType('users.length !== 1')
    const user0 = users[0]
    if (!user0) throw new ErrorCustomSyntax('!user0')

    return signTokenWithTimeAsync(user0.uid)
  },

  async verifyTokenAsync(token: string): Promise<AuthorizationVerifyTokenRes> {

    const promise = new Promise<AuthorizationVerifyTokenRes>((resolve, reject) => {
      jsonwebtoken.verify(
        token, config.jwtSecret,
        async (error, tokenPayload) => {
          if (error) return reject(error)
          if (!isTokenPayload(tokenPayload)) return reject(new ErrorCustomSyntax('!isTokenPayload(tokenPayload)'))

          const users = await userModelRW.readToDocs(
            { uid: tokenPayload.uid }, userModelRW.domSchemaProject, {}, { auth: AUTHORIZATION }
          )
          if(users.length !== 1) return reject(new ErrorCustomType('users.length !== 1'))

          const user = users[0]
          if (!user) return reject(new ErrorCustomSyntax('!user'))
          resolve({ tokenPayload, user })
        }
      )
    })

    return promise
  },
} as const)

////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////
type AuthUserMainT = UserDocSchemaMainI
type AuthUserProjectT = UserDocSchemaMainI
type AuthUserFilterT = UserDocSchemaFilterI

class UserWithPasswordR extends ModelR<
  AuthUserMainT,
  AuthUserProjectT,
  AuthUserFilterT
> {
  async readToDocs<ProjectFields extends keyof AuthUserProjectT>(
    filter: FilterT<UserDocSchemaFilterI>,
    project: Record<ProjectFields, unknown>,
    projectOptions: ProjectionOptionsT<ProjectFields, AuthUserProjectT>,
    options?: ModelOptionsI
  ): Promise<Pick<AuthUserProjectT, ProjectFields>[]> {
    return driverDb.dbReadToDocs(
      this.tabExpression, this.domSchemaFilter, this.domSchemaProject,
      filter,
      project,
      projectOptions,
      options
    )
  }
}

const userWithPasswordR = new UserWithPasswordR(
  'users',
  userModelRW.domSchemaMain,
  userModelRW.domSchemaMain,
  userModelRW.domSchemaFilter
)

async function signTokenAsync(uid: string): Promise<string> {
  const promise = new Promise<string>((resolve, reject) => {
    // "Токен авторизации живет 30 минут"
    jsonwebtoken.sign({ uid }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    }, (error, token) => {
      if (error) return reject(error)
      if (!token) return reject(new ErrorCustomSyntax('!token'))
      resolve(token)
    })
  })
  return promise
}

async function signTokenWithTimeAsync(uid: string): Promise<AuthorizationLoginRes> {
  if (config.jwtExpiresIn !== '30m') throw new ErrorCustomSyntax('JWT_EXPIRES_IN !== 30m')

  const token = await signTokenAsync(uid)
  const expireDate = new Date(Date.now() + 30 * 60 * 1000)
  return { token, expire: expireDate }
}

async function isPasswordCorrectAsync(
  candidatePassword: string, userPasswordHash: string
): Promise<boolean> {
  return await bcryptjs.compare(candidatePassword, userPasswordHash)
}

function isTokenPayload(obj: any): obj is AuthorizationTokenPayloadI {
  if (!obj) return false
  if (typeof obj !== 'object') return false
  if (typeof obj['uid'] !== 'string') return false
  if (typeof obj['iat'] !== 'number') return false
  if (typeof obj['exp'] !== 'number') return false
  if (Object.keys(obj).length !== 3) return false
  return true
}