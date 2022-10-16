import bcryptjs from 'bcryptjs'
import validator from 'validator'
import { driverDb } from '../driver_db.js'
import { DomainSchemaT } from '../domain.js'
import { FilterT } from '../filter.js'
import { ModelOptionsI, ModelRW } from '../model.js'
import { ProjectionOptionsT } from '../projection.js'
import { ErrorCustomType } from '../error.js'


////////////////////////////////////////////////////////////////////////////////
// Document schemas.
////////////////////////////////////////////////////////////////////////////////
export interface UserDocSchemaMainI {
  uid: string, email: string, nickname: string, password: string
}

export interface UserDocSchemaProjectI {
  uid: string, email: string, nickname: string
}

export interface UserDocSchemaCreateI {
  email: string, nickname: string, password: string
}

export interface UserDocSchemaFilterI {
  uid: string, email: string, nickname: string
}

////////////////////////////////////////////////////////////////////////////////
// Domain schemas. Main.
////////////////////////////////////////////////////////////////////////////////
const domSchemaMain: DomainSchemaT<UserDocSchemaMainI> = Object.freeze({
  uid: {
    type: 'string',
    isNullable: false,
    validate(uid: string): boolean {
      return !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uid)
    }
  },

  email: {
    type: 'string',
    isNullable: false,
    validate(email: string): boolean {
      return validator.isEmail(email)
    },
    async convert(email: string): Promise<string> {
      return email.toLowerCase()
    }
  },

  nickname: {
    type: 'string',
    isNullable: false,
    validate(nickname: string): boolean {
      return nickname.length > 0
    }
  },

  password: {
    type: 'string',
    isNullable: false,
    isNotReadable: true,
    validate(password: string): boolean {
      // password: минимальная длинна 8 символов
      if (password.length < 8) throw new ErrorCustomType('password.length < 8')

      // password: должен содержать как минимум одну цифру, одну заглавную и одну строчную буквы.
      if (!/[A-Z]/.test(password)) throw new ErrorCustomType('!/[A-Z]/.test(password)')
      if (!/[a-z]/.test(password)) throw new ErrorCustomType('!/[a-z]/.test(password)')
      if (!/\d/.test(password)) throw new ErrorCustomType('!/\d/.test(password)')

      return true
    },
    async convert(password: string): Promise<string> {
      const passwordHash = await bcryptjs.hash(password, 10)
      return passwordHash
    }
  }
} as const)

////////////////////////////////////////////////////////////////////////////////
// Domain schemas. Other.
////////////////////////////////////////////////////////////////////////////////
const domSchemaProject: DomainSchemaT<UserDocSchemaProjectI> = Object.freeze((() => {
  const { password, ...other } = domSchemaMain
  return other
})())

const domSchemaCreate: DomainSchemaT<UserDocSchemaCreateI> = Object.freeze((() => {
  const { uid, ...other } = domSchemaMain
  return other
})())

const domSchemaFilter: DomainSchemaT<UserDocSchemaFilterI> = Object.freeze((() => {
  const { password, ...other } = domSchemaMain
  return other
})())

////////////////////////////////////////////////////////////////////////////////
// Model.
////////////////////////////////////////////////////////////////////////////////
class UserModelRW extends ModelRW<
  UserDocSchemaMainI,
  UserDocSchemaProjectI,
  UserDocSchemaFilterI,
  UserDocSchemaCreateI
> {
  async readToDocs<ProjectFields extends keyof UserDocSchemaProjectI>(
    filter: FilterT<UserDocSchemaFilterI>,
    project: Record<ProjectFields, unknown>,
    projectOptions: ProjectionOptionsT<ProjectFields, UserDocSchemaProjectI>,
    options?: ModelOptionsI
  ): Promise<Pick<UserDocSchemaProjectI, ProjectFields>[]> {
    return driverDb.dbReadToDocs(
      this.tabExpression, this.domSchemaFilter, this.domSchemaProject,
      filter,
      project,
      projectOptions,
      options
    )
  }

  async create<ProjectFields extends keyof UserDocSchemaProjectI>(
    create: { email: string, nickname: string, password: string }[],
    project: Record<ProjectFields, unknown>,
    options?: ModelOptionsI
  ): Promise<Pick<UserDocSchemaProjectI, ProjectFields>[]> {
    return driverDb.dbCreate(
      this.tabExpression, this.domSchemaCreate, this.domSchemaProject,
      create,
      project,
      options
    )
  }

  async delete<ProjectFields extends keyof UserDocSchemaProjectI>(
    filter: FilterT<UserDocSchemaFilterI>,
    project: Record<ProjectFields, unknown>,
    options?: ModelOptionsI
  ): Promise<Pick<UserDocSchemaProjectI, ProjectFields>[]> {
    return driverDb.delete(
      this.tabExpression, this.domSchemaFilter, this.domSchemaProject,
      filter,
      project,
      options
    )
  }
}

// E.g.: userModelRW.create([{ email: '', nickname: '', password: '' }], { email: '', uid: '' })
export const userModelRW = new UserModelRW(
  'users',
  domSchemaMain,
  domSchemaProject,
  domSchemaFilter,
  domSchemaCreate
)
