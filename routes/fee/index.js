const eah = require('express-async-handler')
const mysql = require('mysql2')

const { fee_auth, fee_url } = require('../../secrets')
const { fee: config } = require('../../secrets/db/config')
const { fee: sql } = require('../../secrets/db/sql')

const pool = mysql.createPool(config).promise()

module.exports = {
    check: (req, res, next) => {
        if (req.session.profiles && req.session.profiles.fee)
            next()
        else
            res.sendStatus(401)
    },
    students: eah(async (req, res) => {
        const result = await pool.execute(sql.students)
        res.json(result)
    }),
    pay: (req, res) => {
        const id = req.body.id
        pool.execute(sql.pay, [id])
            .then(result => {
                res.json({ id: req.body.id, success: (result.changedRows === 1) })
            })
            .catch(err => {
                res.json({ success: false })
            })
    },
    check_auth: (req, res) => {
        if (req.session.profiles && req.session.profiles.fee)
            res.json({ login: true })
        else
            res.json({ login: false })
    },
    login: (req, res) => {
        const username = req.body.username
        const passwd = req.body.password
        if (fee_auth(username, passwd)) {
            if (!req.session.profiles)
                req.session.profiles = {}
            req.session.profiles.fee = username
            res.json({ login: true })
        }
        else
            res.json({ login: false })
    },
    logout: (req, res) => {
        req.session.profiles.fee = null
        res.redirect(fee_url)
    }
}