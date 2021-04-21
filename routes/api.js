const express = require('express')
const oauth = require('./oauth')
const oauthConfig = require('./../secrets/oauth')
const router = express.Router()

// pastexam
// Normal Routes
const pastexamRouter = require('./pastexam')
router.get('/pastexam/course', pastexamRouter.getCourse)
router.get('/pastexam/exam', pastexamRouter.getExam)
router.get('/pastexam/teacher', pastexamRouter.getTeacher)
router.get('/pastexam/download', pastexamRouter.check, pastexamRouter.downloadExam)
router.post('/pastexam/upload', pastexamRouter.check, pastexamRouter.uploadExam)
router.get('/pastexam/check', pastexamRouter.profile)
router.get('/pastexam/logout', pastexamRouter.logout)
// NYCU Oauth Login
const pastexamOauth = oauth(oauthConfig.pastexam.client_id, oauthConfig.pastexam.client_secret, oauthConfig.pastexam.redirect_uri,
    (req, res, next, profile) => {
        if (!req.session.profiles)
            req.session.profiles = {}
        req.session.profiles.pastexam = profile
        res.redirect('https://pastexam.nctucsunion.me/main')
    })
router.get('/pastexam/login', pastexamOauth.login)
router.get('/pastexam/auth', pastexamOauth.auth)

// Fee
const feeRouter = require('./fee')
router.get('/students', feeRouter.check, feeRouter.students)
router.post('/pay', feeRouter.check, feeRouter.pay)
router.post('/fee_check', feeRouter.check_auth)
router.post('/fee_auth', feeRouter.login)
router.post('/fee_logout', feeRouter.logout)

module.exports = router
