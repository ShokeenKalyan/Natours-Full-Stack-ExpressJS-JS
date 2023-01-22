
const Tour = require('./../models/tourModel.js')

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = '-ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next()
} 

exports.getAllTours = async (req, res) => {
    
    try {
        
        //const tours = await Tour.find()

        /* Writing Query - Method 1 
        // We will use this as this is similar to the object req.query
        const tours = await Tour.find({
            duration: 5,
            difficulty: 'easy'
        })
        */

        /* Writing Query - Method 2 - Using special Mongoose Methods
        const query = Tour.find()
            .where('duration').equals(5)
            .where('difficulty').equals('easy')
        */
        
        // BUILD QUERY
        // 1A) Filtering
        const queryObj = {...req.query}
        // In JS, whenever a variable is set to another object, then it will basically be a reference to that object
        // So, to make a hard copy by destructuring the object using ... and then create a new object out of that by {}

        // Create array of all field objects that we want to exclude in the filter query
        const excludedFields = ['page', 'sort', 'limit', 'fields']

        // Now remove these fields from the object
        excludedFields.forEach(el => delete queryObj[el])

        // console.log(req.query, queryObj)

        // 1B) Advanced Filtering
        
        // Mongo filter command for special operators:  { difficulty: 'easy', duration: { $gte: 5 } }
        // Output of req.query(Difference of only '$'): { difficulty: 'easy', duration: { gte: 5 } }

        let queryStr = JSON.stringify(queryObj) // Convert the JSON obj to string
        // Replace the string using Regular Expressions
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`) // \b is for matching exact keywords and /g means that it will happen multiple times
        console.log(JSON.parse(queryStr))


        let query = Tour.find(JSON.parse(queryStr))
        
        // 2) Sorting
        if (req.query.sort) {
            console.log(req.query.sort)
            const sortBy = req.query.sort.split(',').join(' ')
            // Replace , in query.sort to make- sort('price ratingsAverage')
            query = query.sort(sortBy)
        }
        else {
            query = query.sort('-createdAt') // '-' is used for descending sort
        }


        // 3) Field Limiting
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ')
            query = query.select(fields) // This selection of only certain field names is called projecting
            // This is equivalent to query = query.select('name duration price') 
        } 
        else {
            query = query.select('-__v') // '-' here stands for excluding(All except __v)
        }


        //4) Pagination

        const page = req.query.page*1 || 1 // 1 will be the default page number
        const limit = req.query.limit*1 || 100
        const skip = (page-1)*limit

        // page=2&limit=10 - 1-10 page1, 11-20 page2, 21-30 page3, ...
        query = query.skip(skip).limit(limit) // limit(10) limits the amount of results in a query and skip(2) specifies the amount of results that should be skipped before querying
        
        if (req.query.page) {
            const numTours = await Tour.countDocuments()
            if (skip >= numTours) throw new Error('The page does not exist') // If we do not do this, then the code will jump to catch block
        }

        // EXECUTE QUERY
        // query now looks like- query.sort().select().skip().limit()
        const tours = await query

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours 
            }
        })
    }
    catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        })
    }
}

exports.getTour = async (req, res) => {
    
    try {
        const tour = await Tour.findById(req.params.id)
        // findById is equivalent to Tour.findOne({_id: req.params.id})

        res.status(200).json({
            status: 'success',
            data: {
                tour  
            }
        })
    }
    catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        })
    }    
}

exports.createTour = async (req, res) => {
    
    try {
        /* Method 1 - Creating from the instance of the Model
        const newTour = new Tour({})
        newTour.save()
        */
        
        /* Method 2 - Creating right from the Model*/
        const newTour = await Tour.create(req.body)

        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour
            }
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
}

exports.updateTour = async (req, res) => {
    try {
        
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // To return the new updated document
            runValidators: true
        })

        res.status(200).json({
            status: 'success',
            data: {
                tour 
            }
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
}

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id)
        
        res.status(204).json({
            status: 'success',
            data: null 
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
}