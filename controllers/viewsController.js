const Tour = require('../models/tourModel')
const User = require('../models/userModel')
const Booking = require('../models/bookingModel')
const catchAsync = require('../Utils/catchAsync')
const AppError = require('../Utils/appError')

exports.getOverview = catchAsync(async (req, res, next) => {
    
    // 1) Get Tour Data from collection
    const tours = await Tour.find()

    // 2) Build Template
    // 3) Render Template using Tour Data from Step 1 in .pug file
    
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    })
})

exports.getTour = catchAsync(async (req, res, next) => {
    
    // 1) Get the data for requested tour (including reviws and guides)
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    })

    
    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404))
    }
    
    // 2) Build Template
    // 3) Render template using data from Step 1
    
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    })
})


exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    })
}


exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    })
}


exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id })

    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map(el => el.tour)
    const tours = await Tour.find({ _id: { $in: tourIDs } })

    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    })
})


exports.updateUserData = catchAsync(async (req, res, next) => {
    //console.log(req.body) // req.body without urlencoded parser will not work since the data is coming from a html form which we need to parse first
    // console.log("Body", req.body)
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        // We are getting req.user.id from protect middleware
        
        // We possess below 2 attributes in req.body because we gave them name attributes in HTML form
        name: req.body.name,
        email: req.body.email
    },
    {
        new: true, // Get the new updated document result
        runValidators: true
    })

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    })
})
