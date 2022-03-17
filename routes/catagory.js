const express = require('express')
const router = express.Router()

//controllers
const { create, list, read, remove } = require('../controllers/catagory')
const { requireSignin, adminMiddleware} = require('../controllers/auth')

//validators
const { runValidation } = require('../validators')
const { catagoryCreateValidator } = require('../validators/catagory')


router.post('/catagory', catagoryCreateValidator, runValidation, requireSignin, adminMiddleware, create)
router.get('/catagories', list)
router.get('/catagory/:slug', read)
router.delete('/catagory/:slug', requireSignin, adminMiddleware, remove)

module.exports = router;
