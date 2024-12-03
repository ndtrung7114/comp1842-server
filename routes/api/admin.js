const express = require('express')
const router = express.Router()
const adminControllers = require('../../controllers/adminController')
const authMiddleware = require('../../middleware/auth')
const adminMiddleware = require('../../middleware/admin')

router.put('/banUser', authMiddleware, adminMiddleware, adminControllers.banUser)
router.get('/loadAllUser',adminMiddleware, authMiddleware, adminControllers.loadAllUser)


module.exports = router

