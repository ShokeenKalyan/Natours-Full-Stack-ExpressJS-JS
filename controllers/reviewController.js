const Review = require('./../models/reviewModel.js')
//const catchAsync = require('./../utils/catchAsync')
const factory = require('./handlerFactory.js')


exports.getAllReviews = factory.getAll(Review)
/*
exports.getAllReviews = catchAsync(async (req, res, next) => {
    
    let filter = {} // Check if the requested route has a tourId(Already merged with touRoutes in reviewRoutes)
    if (req.params.tourId) filter = { tour: req.params.tourId }

    const reviews = await Review.find(filter)

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    })
})
*/

exports.getReview = factory.getOne(Review)


// Middleware to fetch tour and user from the request URL before hitting the generic create Factory function
exports.setTourIds = (req, res, next) => {
    // Implementing nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId // Fetching tour from the URL parameters
    if(!req.body.user) req.body.user = req.user.id // Fetching user from the protect middleware
}


exports.createReview = factory.createOne(Review)
/*
exports.createReview = catchAsync(async (req, res, next) => {

    // Implementing nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId // Fetching tour from the URL parameters
    if(!req.body.user) req.body.user = req.user.id // Fetching user from the protect middleware

    const newReview = await Review.create(req.body)   

    res.status(200).json({
        status: 'success',
        data: {
            newReview
        }
    })
})
*/

exports.updateReview = factory.updateOne(Review)

exports.deleteReview = factory.deleteOne(Review)