import express from 'express'
import { authMiddleware } from "../middleware/auth.middleware.js"
import { userController } from '../controller/user.controller.js'


export const userRouter = express.Router()

userRouter.post('/user', authMiddleware.authProtect, userController.create)
userRouter.get('/user', authMiddleware.authProtect, userController.read)
userRouter.get('/user/:email', authMiddleware.authProtect, userController.read)
// userRouter.put('/user', authController.authProtect, userController.update)
userRouter.delete('/user/', authMiddleware.authProtect, userController.delete)
userRouter.delete('/user/:email', authMiddleware.authProtect, userController.delete)
