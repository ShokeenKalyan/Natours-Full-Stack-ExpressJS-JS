const express = require('express')
const viewsController = require('../controllers/viewsController.js')
const authController = require('../controllers/authController.js')
const bookingController = require('../controllers/bookingController.js')

const router = express.Router()


// Route for accessing pug templates
/*
router.get('/', (req, res) => {
    res.status(200).render('base', { // Express will go into views folder and look for template with the name base
        tour: 'The Forest Hiker',  // Passing data into pug base template
        user: 'Shokeen' // These variables passed are called locals in pug file
    }) 
})
*/

// Putting isLoggedIn middleware before below routes
// router.use(authController.isLoggedIn)

// Since we hit the overview page on successful completion of booking payment, we need to add createBooking middleware stack in below route
router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewsController.getOverview)
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour)
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm)
router.get('/me', authController.protect, viewsController.getAccount)
router.get('/my-tours', authController.protect, viewsController.getMyTours)

router.post('/submit-user-data', authController.protect, viewsController.updateUserData)

module.exports = router

