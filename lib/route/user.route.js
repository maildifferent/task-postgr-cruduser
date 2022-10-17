import express from 'express';
import { authorizationMiddleware } from "../middleware/auth.middleware.js";
import { userController } from '../controller/user.controller.js';
export const userRouter = express.Router();
userRouter.post('/user', authorizationMiddleware.authProtect, userController.create);
userRouter.get('/user', authorizationMiddleware.authProtect, userController.read);
userRouter.get('/user/:email', authorizationMiddleware.authProtect, userController.read);
// userRouter.put('/user', authController.authProtect, userController.update)
userRouter.delete('/user/', authorizationMiddleware.authProtect, userController.delete);
userRouter.delete('/user/:email', authorizationMiddleware.authProtect, userController.delete);
