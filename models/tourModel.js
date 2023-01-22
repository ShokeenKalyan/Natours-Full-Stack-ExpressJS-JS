const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const User = require('./userModel')


// Specify a schema for data using mongoose
// We can add features like validation and default values in our fields in addition to describing our data
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "The tour must have a name"], // Error message to be displayed if name is missing
        unique: true, // The name must be unique for different tour documents
        trim: true,
        maxlength: [40, 'A tour name must have less or equal to 40 characters'], // these 2 validators are available for strings only
        minlength: [10, 'A tour name must have more or equal to 10 characters'],
        // validate: [validator.isAlpha, 'Tour name must only contain alphabets'] // Custom validator from validator library to check if the tour name contains only alphabets
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must hava a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must hava a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must hava a difficulty'],
        enum: {
           values: ['easy', 'medium', 'difficult'],
           message: 'Difficulty can be easy, medium or difficult'
        } // enum is available only on String
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'The rating must be above 1.0'], // These 2 validators are available on only number and Date types
        max: [5, 'The rating must below 5.0'],
        set: val => Math.round(val*10)/ 10 // To return rounded values for ratingsAverage // 4.66667, 46.66667, 47, 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "The tour must have a price"]
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
            // Custom validator to check if the discount is less than the price or not
            // this only points to current doc on NEW document creation and not for doc on updation
            return val < this.price
            },
            message: 'Discount price ({VALUE}) shuld be less than Regular Price'
        }
    },
    summary: {
        type: String,
        trim: true, // To remove white spaces from the string from the begining and end
        required: [true, "The tour must have a description"]
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, "The tour must have a cover image"]
    },
    images: [String], // An array with multiple string type images
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false // Hides the field on a get request
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    // Modelling Location Dataset embedded(denormalized) inside tour Dataset
    startLocation: {
        // MongoDB uses GeoJSON to specify Geospatial data with at least 2 properties- type & coordinates
        type: {
            type: String,
            default: 'Point', // we can specify multiple geometries like lines, polygons etc
            enum: ['Point']
        },
        coordinates: [Number], // Longitude First and then Latitude
        address: String,
        description: String
    },
    // Embedding the data of all locations the tour pass through in a array of objects inside the parent tour document
    locations: [
         {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number // The dat of tour that people will reach this location
         } 
    ],
    //guides: Array // embedding users(tour-guides) data in tours data 
    guides: [ // referncing users from tours
        {
            type: mongoose.Schema.ObjectId, // Every element in guides array to be a MongoDb ID
            ref: 'User' // Establishing references b/w different datasets(Tours and Users) in Mongoose
        }
    ] 
}, {
    // schema options
    toJSON: { virtuals: true }, // Each time data is outputed as JSON, we want virtuals to be in O/P
    toObject: { virtuals: true }
})

// Creating Indexes so that read performance improves for certain queries
// tourSchema.index({ price: 1 }) // create index in ascending order of peices(1); -1 for descending
// After this, query.explain gives execution stats as: #Docs scanned = 3, #Docs returned: 3 (For price less than 1000)
// Above is a single field index(only price field)

// Creating a compound index (Basing price and ratingsAverage, which most people would be searching for)
tourSchema.index({ price: 1, ratingsAverage: -1 })
// After this, execution stats: #Docs scanned = 2, #Docs returned = 2 => More efficient (For price <1000 & ratingsAverage > 4.7)
// Creating indexes is ideal only for high read:write ratio applications as we would then have to update indexes continuously. Also indexes take high space in memory
// To implement indexes, it is crucial to study read-write and access patterns of resources

// Creating index for the tour slug(unique slug is to be used for querying the tours)
tourSchema.index( {slug: 1} )

// Adding index to startlocation to be able to efficiently search tours within some distance of a geo-location
tourSchema.index( {startLocation: '2dsphere'} ) // startLocation indexed to 2d Sphere where all geodata is located

// Defining Virtual Properties- Properties not going to be persisted/saved in DB
// get method helps to create the virtual prop each time we get some data out from the DB
tourSchema.virtual('durationWeeks').get(function() {
    // We need function and not ()=> since latter does not have access to this keyword
    return this.duration/7
})
// Virtual prop cannot be used in a query since they are not a part of DB


// Using Virtual Populate: Populating reviews(child) array of a tour(parent)
// Through this, the O/P will show the list of reviews for a particular tour without the nedd of persisting it to the Database
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id' // Tour has a _id property on local model(tourModel) and a 'tour' property on foreign model(reviewModel)
})


// DOCUMENT MIDDLEWARE

// Document Middleware of Mongoose - runs before .save() and .create() - Helps to manipulate documents currently being saved/created
// pre middleware runs before an actual event/hook(save)
tourSchema.pre('save', function(next) {
    //console.log(this)
    this.slug = slugify(this.name, {lower: true})
    next()
})

/*
// We can have multiple middlewares for the same hook(save)
tourSchema.pre('save', function(next) {
    console.log('Will save the document...')
    next()
})

// post middleware
tourSchema.post('save', function(doc, next) {
    // We have in post access to the document which is saved in the DB
    console.log(doc)
    next()
})
*/

/* Embedding users into tours
// Middleware to fetch and overwrite user details on 'guides' property corresponding to user ids obtained in req.body
tourSchema.pre('save', async function(next) {
    const guidesPromises = this.guides.map(async id => await User.findById(id)) // This returns an array of promises
    this.guides = await Promise.all(guidesPromises)
    next()
})
*/

// QUERY MIDDLEWARE
// Query middleware helps to process the current query

//tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
    // Above Regex helps to run the middleware on all find queries- find, findOne, findMany, findOneAndUpdate etc
    // this here is a query object- So we can chain all methods of queries
    this.find({ secretTour: {$ne: true} })
    
    this.start = Date.now()
    next()
})
// This middleware hides the documents which has secretTour set to true


// Query Middleware to populate data on 'guides' field which contains Mongoos Id of Users dataset
tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    }) // Populating guides field(which only contain Mongoose ID references to User dataset)
    // This populates only the query O/P and not the actual DB
    next()
})


tourSchema.post(/^find/, function(docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds`)
    // console.log(docs)
    next()
})




// AGGREGATION MIDDLEWARE

/*
tourSchema.pre('aggregate', function(next) {
    // Here, this points to the current aggregation object
    // console.log(this.pipeline()) // It gives the array of pipelines specified in the request route- match, group & sort
    // Add another 'match' to this pipeline array
    this.pipeline().unshift({ $match: {secretTour: {$ne: true}} })
    next()
})
// Removing this middleware as it puts $match as first stage of aggregation pipline which is not desirable while aggregating $geoNear(Nearest tours from a point)
*/

// Create a model from above scheme
const Tour = mongoose.model('Tour', tourSchema )

module.exports = Tour