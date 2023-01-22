const multer = require('multer') 
const sharp = require('sharp') 

const AppError = require('./../Utils/appError.js')
const Tour = require('./../models/tourModel.js')
const APIFeatures = require('./../Utils/apiFeatures.js')
const catchAsync = require('./../Utils/catchAsync.js')
const factory = require('./handlerFactory.js')


const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
    if ( file.mimetype.startsWith('image') ) {
        cb(null, true)
    }
    else {
        cb(new AppError('Not an image! Please upload only images.', 400), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

// using upload.fields to upload multiple images
exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1}, // Imagecover can have only 1 photo
    {name: 'images', maxCount: 3} // Images can have upto 3 photos
])
// If only a single field with a single images, then use-
// upload.single('imageCover', 1)
// If only a single field with multiple images, then we could have used-
// upload.array('images', 3)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    //console.log(req.files) // If there are multiple images, then they are located in req.files and not in req.file

    if ( !req.files.imageCover || !req.files.images ) {
        return next()
    }
    
    // 1) Processing Cover Image
    
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg` // Putting the imageCoverFilename on req.body which is used by updateTour function

    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90}) // Reducing memory space to 90%
        .toFile(`public/img/tours/${req.body.imageCover}`) // Finally writing the file to the disc
    
    // 2) Processing Other Images
    req.body.images = []
    
    // Below line will return a array of promises, so we use Promises.all
    await Promise.all(
            req.files.images.map(async (file, i) => {
                const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`

            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({quality: 90}) // Reducing memory space to 90%
                .toFile(`public/img/tours/${filename}`)
    
            req.body.images.push(filename)
        })
    )
    
    next()
})


exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = '-ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next()
}


//exports.getAllTours = factory.getAll(Tour)

exports.getAllTours = catchAsync(async (req, res, next) => {

    // EXECUTE QUERY

    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    const tours = await features.query

    // SEND RESPONSE

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    })
})


// Calling Factory getOne with additional parameter to populate the tour data with reviews data
exports.getTour = factory.getOne(Tour, {path: 'reviews'})
/*
exports.getTour = catchAsync(async (req, res, next) => {
    
    const tour = await Tour.findById(req.params.id).populate('reviews')

    if (!tour) {
        return next(new AppError('No Tour found with that ID', 404)) 
    } // return immediately with error

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })
})
*/

exports.createTour = factory.createOne(Tour)
/*
exports.createTour = catchAsync(async (req, res, next) => {

    const newTour = await Tour.create(req.body)

    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    })
})
*/

exports.updateTour = factory.updateOne(Tour)
/*
exports.updateTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if (!tour) {
        return next(new AppError('No Tour found with that ID', 404)) 
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })
})
*/


exports.deleteTour = factory.deleteOne(Tour) // Using Factory Handler to delete the Model(Tour)
/*
exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id)

    if (!tour) {
        return next(new AppError('No Tour found with that ID', 404)) 
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
})
*/


// Implementing MongoDB's Aggregate Pipeline feature
exports.getTourStats = catchAsync(async (req, res, next) => {

    // aggregate method in MongoDB/mongoose helps to manipulate data in different steps
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                //_id: null,
                //_id: '$difficulty',
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: {
                // Use the variable names set above in group
                avgPrice: 1 // 1 for asc
            }
        }
        /*
        {
            // We can repeat stages also
            $match: { _id: { $ne: 'EASY' } }
        }
        */
    ])

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })

})


exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = req.params.year * 1

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates' // unwind deconstructs an array field & then output one document for each element of array (9*3 = 27 documents)
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })

})


exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params
    const [ lat, lng ] = latlng.split(',')

    // Calculating radius in radians(dist/radius of earth) which MongoDB would understand
    const radius = unit === 'mi' ? distance/3963.2 : distance/6378.1     
    
    if (!lat || !lng) {
        next(new AppError('Please provide latitude & longitude in the format lat,lng.'), 400)
    }

    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    })
    
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })
})


exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params
    const [ lat, lng ] = latlng.split(',')

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001 // 1 mtr = 0.000621371 miles

    if (!lat || !lng) {
        next(new AppError('Please provide latitude & longitude in the format lat,lng.'), 400)
    }

    // Find distances of all tours from a given geo-location
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng*1, lat*1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    })
})
