import express from 'express'
import { driverFrontAuthorizationController } from '../driver_front_controllers/auth.controller.js'


export const driverFrontAuthRouter = express.Router()

driverFrontAuthRouter.post('/signin', driverFrontAuthorizationController.signin)
driverFrontAuthRouter.post('/login', driverFrontAuthorizationController.login)