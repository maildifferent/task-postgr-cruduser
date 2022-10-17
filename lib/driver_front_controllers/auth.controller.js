import { driverFront } from "../driver_front.js";
import { authorization } from '../authorization.js';
import { ErrorCustomSyntax, ErrorCustomType } from '../error.js';
////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const driverFrontAuthorizationController = {
    async authProtect(req, res, next) {
        try {
            const token = getTokenFromRequest(req);
            const verifyTokenRes = await authorization.verifyTokenAsync(token);
            if ('auth' in req)
                throw new ErrorCustomSyntax('auth in req');
            req.auth = verifyTokenRes;
            return next();
        }
        catch (error) {
            return driverFront.responseErr(res, 401, error);
        }
    },
    async signin(req, res) {
        try {
            let unknown = driverFront.getLinkDataFromReq(req);
            if (!unknown)
                unknown = req.body[driverFront.CONSTS.data];
            const loginRes = await authorization.signinUntyped(unknown);
            return driverFront.response(res, loginRes);
        }
        catch (error) {
            return driverFront.responseErr(res, 500, error);
        }
    },
    async login(req, res) {
        try {
            let unknown = driverFront.getLinkDataFromReq(req);
            if (!unknown)
                unknown = req.body[driverFront.CONSTS.data];
            if (typeof unknown !== 'object')
                throw new ErrorCustomType('typeof unknown !== object');
            const { password, ...user } = { password: undefined, ...unknown };
            const loginRes = await authorization.loginUntyped(user, password);
            return driverFront.response(res, loginRes);
        }
        catch (error) {
            return driverFront.responseErr(res, 401, error);
        }
    }
};
////////////////////////////////////////////////////////////////////////////////
// Private util.
////////////////////////////////////////////////////////////////////////////////
function getTokenFromRequest(req) {
    if (!req || !req.headers || !req.headers.authorization)
        throw new ErrorCustomType('!req || !req.headers || !req.headers.authorization');
    if (!req.headers.authorization.startsWith('Bearer '))
        throw new ErrorCustomType('!req.headers.authorization.startsWith(Bearer )');
    const token = req.headers.authorization.split(' ')[1];
    if (typeof token !== 'string')
        throw new ErrorCustomType('typeof token !== string');
    return token;
}
