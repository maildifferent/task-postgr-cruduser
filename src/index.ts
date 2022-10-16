"use strict";
console.clear()
import express from 'express'
import path from 'path'
import { config } from './config.js';
import { driverFrontAuthRouter } from './driver_front_routes/auth.route.js';
import { driverFrontUserRouter } from './driver_front_routes/user.route.js';


const PORT = config.port || 8080
const app = express()

app.use(express.json())
app.use('/api', driverFrontAuthRouter)
app.use('/api', driverFrontUserRouter)

app.get('/', (req, res) => { res.json({ message: 'Server works message...' }) })
app.use('/pub', express.static(path.resolve() + '/pub'))
app.use('/lib/pub', express.static(path.resolve() + '/lib/pub'))

app.listen(PORT, () => { console.log(`Server started on port: ${PORT}`) })