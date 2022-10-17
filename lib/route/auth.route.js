import express from 'express';
import { authorizationController } from '../controller/auth.controller.js';
export const driverFrontAuthRouter = express.Router();
driverFrontAuthRouter.post('/signin', authorizationController.signin);
driverFrontAuthRouter.post('/login', authorizationController.login);
