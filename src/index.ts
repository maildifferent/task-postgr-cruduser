"use strict";
console.clear()
import express from 'express'
import path from 'path'
import { config } from './config.js';
import { authRouter } from './route/auth.route.js';
import { userRouter } from './route/user.route.js';


const PORT = config.port || 8080
const app = express()

app.use(express.json())

app.options('*', function (req, res) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
})

app.use('/api', authRouter)
app.use('/api', userRouter)

app.get('/', (req, res) => { res.json({ message: 'Server works message...' }) })
app.use('/pub', express.static(path.resolve() + '/pub'))
app.use('/lib/pub', express.static(path.resolve() + '/lib/pub'))

app.listen(PORT, () => { console.log(`Server started on port: ${PORT}`) })