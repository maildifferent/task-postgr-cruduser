import { DriverFrontModelRW } from "../driver_front.js";
import { userModelRW } from "../model/user.model.js";


export const userController = new DriverFrontModelRW(userModelRW)

