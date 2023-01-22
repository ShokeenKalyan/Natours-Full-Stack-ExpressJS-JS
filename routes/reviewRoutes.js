const express = require('express')
const reviewController = require('./../controllers/reviewController.js')
const authController = require('./../controllers/authController.js')

const router = express.Router({ mergeParams: true })
// By default, each router only have access to parameters of their specific routes
// For accessing tourId parameter(defined in tourRoutes for creating a review for a tour), we need to merge the parameters

router.use(authController.protect) // Middleware for protecting(Authentcating) below routes

router.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourIds, reviewController.createReview) // Post a review only if the user is logged-in(authenticated) and has a role 'user'

router.route('/:id')
    .get(reviewController.getReview)
    .delete(authController.restrictTo('user', 'admin'),  reviewController.deleteReview) // Guides and lead guides cannot modify or delete reviews
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)

module.exports = router
