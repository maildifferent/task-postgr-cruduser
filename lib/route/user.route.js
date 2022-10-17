import express from 'express';
import { authorizationMiddleware } from "../middleware/auth.middleware";
import { userController } from '../controller/user.controller.js';
export const driverFrontUserRouter = express.Router();
driverFrontUserRouter.post('/user', authorizationMiddleware.authProtect, userController.create);
driverFrontUserRouter.get('/user', authorizationMiddleware.authProtect, userController.read);
driverFrontUserRouter.get('/user/:email', authorizationMiddleware.authProtect, userController.read);
// userRouter.put('/user', authController.authProtect, userController.update)
driverFrontUserRouter.delete('/user/', authorizationMiddleware.authProtect, userController.delete);
driverFrontUserRouter.delete('/user/:email', authorizationMiddleware.authProtect, userController.delete);
