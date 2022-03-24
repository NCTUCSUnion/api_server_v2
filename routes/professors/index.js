const express = require('express')
const { professors_root_path: root_path } = require('../../secrets')
const { professors_redirect_to_login_path: login_path } = require('../../secrets')

module.exports = {
    check: (req, res, next) => {
        console.log(req.session.profiles)
	if (req.session.profiles && req.session.profiles.professors) {
            next()
        }
        else
            res.redirect(login_path)
    },
    statics: express.static(root_path)
}
