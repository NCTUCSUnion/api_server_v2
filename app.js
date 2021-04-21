const bodyParser = require('body-parser')
const cors = require('cors')
const createError = require('http-errors')
const express = require('express')
const logger = require('morgan')
const mysqlStore = require('express-mysql-session')
const session = require('express-session')

// The Express App
const app = express()
// Apply Middleware
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// Cross-Origin Resource Sharing, CORS
app.use(cors({
    credentials: true,
    origin: [
        /^https:\/\/([^/]+\.)?nctucsunion.me\/?$/
    ],
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept'
}))
// Session Store
const secrets = require('./secrets')
const dbconfig = require('./secrets/db/config')
const sessionStore = new mysqlStore(dbconfig.session)
app.use(session({
    name: 'session',
    secret: secrets.session_key,
    store: sessionStore,
    saveUninitialized: true, // 是否自動儲存未初始化的會話，建議false
    resave: false, // 是否每次都重新儲存會話，建議false
    rolling: true,
    cookie: {
        domain: 'nctucsunion.me',
        maxAge: 600 * 1000 // 有效期，單位是毫秒
    }
}));
// Main Router
const api = require('./routes/api')
app.use('/_apiv2', api)

// 404 and Error Handler
app.use((req, res, next) => {
    next(createError(404))
})
app.use((err, req, res, next) => {
    console.log(err)
    res.sendStatus(err.status || 500)
})

module.exports = app
