import express from 'express'
import { driverFrontAuthorizationController } from '../driver_front_controllers/auth.controller.js'
import { driverFrontUserControllerModelRW } from '../driver_front_controllers/user.controller.js'


export const driverFrontUserRouter = express.Router()

driverFrontUserRouter.post('/user', driverFrontAuthorizationController.authProtect, driverFrontUserControllerModelRW.create)
driverFrontUserRouter.get('/user', driverFrontAuthorizationController.authProtect, driverFrontUserControllerModelRW.read)
driverFrontUserRouter.get('/user/:email', driverFrontAuthorizationController.authProtect, driverFrontUserControllerModelRW.read)
// userRouter.put('/user', authController.authProtect, userController.update)
driverFrontUserRouter.delete('/user/', driverFrontAuthorizationController.authProtect, driverFrontUserControllerModelRW.delete)
driverFrontUserRouter.delete('/user/:email', driverFrontAuthorizationController.authProtect, driverFrontUserControllerModelRW.delete)
