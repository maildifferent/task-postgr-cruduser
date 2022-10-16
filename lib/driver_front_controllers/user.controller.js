import { DriverFrontModelRW } from "../driver_front.js";
import { userModelRW } from "../models/user.model.js";
export const driverFrontUserControllerModelRW = new DriverFrontModelRW(userModelRW);
