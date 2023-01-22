
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY) // Need to pass in the api key(Secret key for backend) also

const AppError = require('./../Utils/appError.js')
const Tour = require('./../models/tourModel.js')
const Booking = require('./../models/bookingModel.js')
const catchAsync = require('./../Utils/catchAsync.js')
const factory = require('./handlerFactory.js')


exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get currently booked Tour
    const tour = await Tour.findById(req.params.tourId)

    // 2) Create Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // To create a fresh booking in Bookings DB, we have to pass relevant data in a query string in below success url
        // We cannot utilize req.body to persist new data since stripe uses a get request here
        // Although this is not secure since anyone can simply call below url and book a tour without having to pay for it
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email, // We have user email due to protect middleware
        client_reference_id: req.params.tourID,
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount: tour.price * 100, // Amount is to be in cents
                currency: 'usd',
                quantity: 1
            }
        ]
    })

    // 3) Create session as response
    res.status(200).json({
        status: 'success',
        session
    })
})

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // This is temporary solution since it is not secure

    const {tour, user, price} = req.query

    if ( !tour && !user && !price ) {
        return next()
    }

    await Booking.create({tour, user, price})

    // Instead of sending traditional api as response, we would be redirecting to __ since we want to remove our query string from request url for security purposes
    res.redirect(req.originalUrl.split('?')[0]) // This would again hit above middleware but now without query parameters

})

exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBookings = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)
