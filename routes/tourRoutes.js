
const express = require('express')
const tourController = require('./../controllers/tourController.js')
const authController = require('./../controllers/authController.js')
//const reviewController = require('./../controllers/reviewController.js')
const reviewRoutes = require('./reviewRoutes.js')

const router = express.Router()

// Creating a review for a given tour(tourId)
router.use('/:tourId/reviews', reviewRoutes) // Mounting the router on reviewRoute in case of a url request like this


// Implementing Params Middleware
// This would work for requests with id property(get, patch & update)
// In param function, we also get access to value of parameter in question
/*
router.param('id', (req, res, next, val) => {
    console.log(`Tour id is ${val}`)
    next()
})
*/
// router.param('id', tourController.checkId) // Check if the id is valid or not using param middleware

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan)

// Router to find nearest tours within x distance from a certain location
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin)
// Alternate traditional way - tours-within?distance=233&center=-40,45&unit=mi
// Above way(More cleaner) - tours-within/233/center/-40,45/unit/mi

// Router to find distances of all tours from a certain point
router.route('/distances/:latlng/:unit').get(tourController.getDistances)

router.route('/')
    //.get(authController.protect, tourController.getAllTours) // If user is not authenticated, then no access to Tours
    .get(tourController.getAllTours)
    .post( authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.uploadTourImages, tourController.resizeTourImages, tourController.createTour) // Only authenticated(logged-in) admins & lead-guides can create tours
    //.post(tourController.checkBody, tourController.createTour) // Chaining multiple middlewares

router.route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'),  tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour) // before deletion, ensure thst user is logged in and authorized as admin or lead-guide to be able to delete tours

/*
router.route('/:tourId/reviews')
    .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)
*/

    // Using module.exports for single export
module.exports = router