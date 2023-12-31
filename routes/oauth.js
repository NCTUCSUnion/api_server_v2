const axios = require('axios')
const qs = require('querystring')
const https = require('https')

module.exports = (client_id, client_secret, redirect_uri, profile_callback) => ({
    login: (req, res) => {
        res.redirect(`https://id.nycu.edu.tw/o/authorize/?client_id=${client_id}&response_type=code&scope=profile`)
    },
    auth: (req, res, next) => {
        const agent = new https.Agent({  
            rejectUnauthorized: false // bypass certificate error
          });
        const code = req.query.code
        axios.post('https://id.nycu.edu.tw/o/token/',
            qs.stringify({
                grant_type: 'authorization_code',
                code,
                client_id,
                client_secret,
                redirect_uri
            }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: agent
        })
            .then(res => res.data)
            .then(
                json => (
                    axios.get('https://id.nycu.edu.tw/api/profile/', { headers: { Authorization: `Bearer ${json.access_token}` } })
                )
            )
            .then(res => res.data)
            .then(
                profile => profile_callback(req, res, next, profile)
            )
            .catch(next)
    }
})
