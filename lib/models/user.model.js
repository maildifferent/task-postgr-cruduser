import bcryptjs from 'bcryptjs';
import validator from 'validator';
import { driverDb } from '../driver_db.js';
import { ModelRW } from '../model.js';
import { ErrorCustomType } from '../error.js';
////////////////////////////////////////////////////////////////////////////////
// Domain schemas. Main.
////////////////////////////////////////////////////////////////////////////////
const domSchemaMain = Object.freeze({
    uid: {
        type: 'string',
        isNullable: false,
        validate(uid) {
            return !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uid);
        }
    },
    email: {
        type: 'string',
        isNullable: false,
        validate(email) {
            return validator.isEmail(email);
        },
        async convert(email) {
            return email.toLowerCase();
        }
    },
    nickname: {
        type: 'string',
        isNullable: false,
        validate(nickname) {
            return nickname.length > 0;
        }
    },
    password: {
        type: 'string',
        isNullable: false,
        isNotReadable: true,
        validate(password) {
            // password: минимальная длинна 8 символов
            if (password.length < 8)
                throw new ErrorCustomType('password.length < 8');
            // password: должен содержать как минимум одну цифру, одну заглавную и одну строчную буквы.
            if (!/[A-Z]/.test(password))
                throw new ErrorCustomType('!/[A-Z]/.test(password)');
            if (!/[a-z]/.test(password))
                throw new ErrorCustomType('!/[a-z]/.test(password)');
            if (!/\d/.test(password))
                throw new ErrorCustomType('!/\d/.test(password)');
            return true;
        },
        async convert(password) {
            const passwordHash = await bcryptjs.hash(password, 10);
            return passwordHash;
        }
    }
});
////////////////////////////////////////////////////////////////////////////////
// Domain schemas. Other.
////////////////////////////////////////////////////////////////////////////////
const domSchemaProject = Object.freeze((() => {
    const { password, ...other } = domSchemaMain;
    return other;
})());
const domSchemaCreate = Object.freeze((() => {
    const { uid, ...other } = domSchemaMain;
    return other;
})());
const domSchemaFilter = Object.freeze((() => {
    const { password, ...other } = domSchemaMain;
    return other;
})());
////////////////////////////////////////////////////////////////////////////////
// Model.
////////////////////////////////////////////////////////////////////////////////
class UserModelRW extends ModelRW {
    async readToDocs(filter, project, projectOptions, options) {
        return driverDb.dbReadToDocs(this.tabExpression, this.domSchemaFilter, this.domSchemaProject, filter, project, projectOptions, options);
    }
    async create(create, project, options) {
        return driverDb.dbCreate(this.tabExpression, this.domSchemaCreate, this.domSchemaProject, create, project, options);
    }
    async delete(filter, project, options) {
        return driverDb.delete(this.tabExpression, this.domSchemaFilter, this.domSchemaProject, filter, project, options);
    }
}
// E.g.: userModelRW.create([{ email: '', nickname: '', password: '' }], { email: '', uid: '' })
export const userModelRW = new UserModelRW('users', domSchemaMain, domSchemaProject, domSchemaFilter, domSchemaCreate);
