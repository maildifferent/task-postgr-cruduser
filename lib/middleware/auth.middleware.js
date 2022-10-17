import { driverFront } from "../driver_front.js";
import { authorization } from '../authorization.js';
import { ErrorCustomSyntax } from '../error.js';
import { getTokenFromRequest } from '../controller/auth.controller';
////////////////////////////////////////////////////////////////////////////////
// Main.
////////////////////////////////////////////////////////////////////////////////
export const authorizationMiddleware = ({
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
    }
});
