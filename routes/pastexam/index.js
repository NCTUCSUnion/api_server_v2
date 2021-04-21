const eah = require('express-async-handler')
const formidable = require('formidable')
const { promises: fs } = require('fs')
const mysql = require('mysql2')
const path = require('path')

const { pastexam: config } = require('../../secrets/db/config')
const { pastexam: sql } = require('../../secrets/db/sql')
const { pastexam_store: store } = require('../../secrets')

const pool = mysql.createPool(config).promise()

const processCategory = category => {
    switch (category) {
        case "大一":
            return 1
        case "大二":
            return 2
        case "大三":
            return 3
        case "大四":
            return 4
        case "研究所":
            return 5
        case "資工其他":
            return 6
        case "考資工研究所":
            return 8
        case "非資工科目":
        default:
            return 7
    }
}
const processType = type => {
    switch (type) {
        case "期中考":
            return 'midterm'
        case "第一次期中考":
            return 'midterm1'
        case "第二次期中考":
            return 'midterm2'
        case "期末考":
            return 'final'
        case "小考":
            return 'test'
        default:
            return 'other'
    }
}

module.exports = {
    check: (req, res, next) => {
        if (req.session.profiles && req.session.profiles.pastexam) {
            next()
        }
        else
            res.sendStatus(403)
    },
    profile: (req, res) => {
        if (req.session.profiles && req.session.profiles.pastexam) {
            const { username: id, ...profile } = req.session.profiles.pastexam
            res.json({ id, ...profile })
        }
        else
            res.json({ id: 0 })
    },
    logout: (req, res) => {
        req.session.profiles.pastexam = null
        res.redirect('https://pastexam.nctucsunion.me')
    },
    getCourse: eah(async (req, res) => {
        const [rows] = await pool.execute(sql.getCourse)
        res.json(rows)
    }),
    getTeacher: eah(async (req, res) => {
        const [rows] = await pool.execute(sql.getTeacher)
        res.json(rows)
    }),
    getExam: eah(async (req, res) => {
        const id = req.query.id
        const [rows] = await pool.execute(sql.getList, [id])
        res.json(rows)
    }),
    uploadExam: eah(async (req, res, next) => {
        const form = new formidable.IncomingForm()
        const [fields, files] = await new Promise((resolv, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject()
                else resolv([fields, files])
            })
        })
        // Process Category and Type
        const category = processCategory(fields.category.toString().trim())
        const type = processType(fields.type)
        // Get iid (Instructor)
        const instructor = fields.instructor.toString().trim()
        var [iidRow] = await pool.execute(sql.instructorGet, [instructor])
        if (iidRow[0] === undefined)
            await pool.execute(sql.instructorAdd, [instructor])
        var [iidRow] = await pool.execute(sql.instructorGet, [instructor])
        const iid = iidRow[0].iid
        // Get cid (Course)
        const course = fields.course.toString().trim()
        var [cidRow] = await pool.execute(sql.courseGet, [course])
        if (cidRow[0] === undefined)
            await pool.execute(sql.courseAdd, [course, category])
        var [cidRow] = await pool.execute(sql.courseGet, [course])
        const cid = cidRow[0].cid
        // Insert Record and Move files
        const uid = fields.uid  // Provider
        console.log('=== Pre-Upload ===')
        console.log(`cid      : ${cid}`)
        console.log(`uid      : ${uid}`)
        console.log(`iid      : ${iid}`)
        console.log(`semester : ${fields.semester}`)
        console.log(`type     : ${type}`)
        console.log(`filename : ${fields.filename}`)
        console.log(`date     : ${new Date()}`)
        console.log('=== Upload ===')
        const [eidrow] = await pool.execute(sql.upload, [cid, uid, uid, iid, fields.semester, type, fields.filename, new Date()])
        const eid = eidrow.insertId
        console.log(`Uploaded: ${req.session.profiles.pastexam.username} - ${eid}`)
        console.log('=== Post-Upload ===')
        const oldpath = files.file.path
        const newpath = store + '/' + eid
        const fileData = await fs.readFile(oldpath)
        await fs.writeFile(newpath, fileData)
        await fs.unlink(oldpath)
        console.log('File uploaded')
        res.sendStatus(200)
    }),
    downloadExam: eah(async (req, res) => {
        const eid = req.query.eid.toString().trim()
        const [result] = await pool.execute(sql.getFilename, [eid])
        if (result.length == 0) {
            res.sendStatus(404)
        }
        else {
            res.download(path.join(store, eid), result[0].filename)
        }
    })
}
