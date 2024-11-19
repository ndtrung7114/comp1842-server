const express = require('express')
const router = express.Router()
const authControllers = require('../../controllers/authController')
const authMiddleware = require('../../middleware/auth')

const upload = require('../../middleware/upload')


router.post('/register', authControllers.register)

router.post('/login', authControllers.login)

router.post('/logout', authControllers.logout)

router.post('/refresh', authControllers.refresh)

router.get('/user', authMiddleware, authControllers.user)

router.get('/user/:id', authMiddleware, authControllers.viewUserById)

router.post('/forgot-password', authControllers.forgotPassword)

router.post('/verify-otp', authControllers.verifyOtp)

router.post('/reset-password', authControllers.resetPassword)

router.put('/update-password/:id', authMiddleware, authControllers.updatePassword)

router.put('/update-profile/:id', authMiddleware, upload, authControllers.updateProfile)

module.exports = router