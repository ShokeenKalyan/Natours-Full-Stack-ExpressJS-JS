
const mongoose = require('mongoose')
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot be empty']
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Reviw must belong to a tour']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user']
        }
    },
    {
        toJSON: { virtuals: true }, 
        toObject: { virtuals: true }
    }
)

// Middleware to prevent a user from writing multiple reviews on the same tour using compound index on a unique tour and a unique user
reviewSchema.index( {tour: 1, user: 1}, { unique: true } ) // This ensures that each combination of user and tour have always to be unique 


// Middleware to populate user and tour details in get review queries
reviewSchema.pre(/^find/, function(next) {
    /*
    this.populate({
        path: 'tour',
        select: 'name'
    }).populate({
        path: 'user',
        select: 'name'
    }) // Populating twice- once for tours and then for users
    */

    this.populate({
        path: 'user',
        select: 'name'
    }) 
    
    next()
})

// Calculating N0 of Ratings and Average Rating on a tour using Mongoose statics feature
reviewSchema.statics.calcAverageRating = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ])
    // Persisting stats to DB
    if (stats.length > 0) { // Update only when there are reviews in the tour
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating, // stats gets registered as an array
            ratingsAverage: stats[0].avgRating
        })
    }
    else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }   
}

// Middleware to calculate stats each time a new review is created and persisted to DB
reviewSchema.post('save', function(next) {
    // This points to current review
    this.constructor.calcAverageRating(this.tour) // Since Review variable is not available yet, we have to use this.constructor to point towards the current model that created the object
    //Review.calcAverageRating(this.tour) // calcAverageRating now being available on the model
    //next() // Post middleware does not get access to next
})

// Middleware to modify ratings stats once a review is updated or deleted
// We will be using query middleware since we need to find the review Id by findByIdAndUpdate or findByIdAndDelete
// But we don't have access to 'this.constrictor'(Current Model) in query middlewares unlike document middlewares
// Behind the scenes findByIdAnd is really findByOne is mongoDb
// We cannot use post method like above since then we would lose access to our query object
// But with using pre, our output will not be reflected with correct statistics since they are not yet persisted in DB
reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne() // this points to current query but this.findOne helps to locate the document
    next()
})

// Now after locating the object, we can use a document post middleware to persist our updated stats in DB
reviewSchema.post(/^findOneAnd/, async function(){
    // await this.findOne() // This would not work here, query has already executed
    await this.r.constructor.calcAverageRating(this.r.tour) // this.r(review) is obtained from previous query middlewares
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review
