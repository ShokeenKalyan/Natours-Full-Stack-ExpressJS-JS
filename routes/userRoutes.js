
const express = require('express')
const userController = require('./../controllers/userController.js')
const authController = require('./../controllers/authController.js')


const router = express.Router()

router.post('/signup', authController.signup) // Does not follow REST philosophy
router.post('/login', authController.login)
router.get('/logout', authController.logout)

router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

router.use(authController.protect) // Adding a authentication middleware on our router mini-application to protect below routes

router.patch('/updateMyPassword', authController.updatePassword)

router.get('/me', userController.getMe, userController.getUser) // Protect gives the req.user which is then put on req.params by getMe which is to be used by getUser(getOne factory function)

// upload.single('photo') is the middleware to upload the file(single since we have only 1 file to upload)
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe) // 'photo' is going to hold the image we upload
router.delete('/deleteMe', userController.deleteMe)

router.use(authController.restrictTo('admin')) // Midldleware to allow only admin users to access below routes

router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)


module.exports = router


