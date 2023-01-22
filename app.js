// We will be using app as for middleware declarations

const path = require('path') // Built-in Node Module to manipulate path names
const express = require('express')
const fs = require('fs')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')
const compression = require('compression') // To compress our text/html/json responses to client

const AppError = require('./utils/appError.js')
const globalErrorHandler = require('./controllers/errorController.js')

const tourRouter = require('./routes/tourRoutes.js')
const userRouter = require('./routes/userRoutes.js')
const reviewRouter = require('./routes/reviewRoutes.js')
const bookingRouter = require('./routes/bookingRoutes.js')
const viewRouter = require('./routes/viewRoutes.js')

// Start Express App
const app = express()

// app.enable('trust proxy') // To trust proxy servers like heroku(for deployment)

// Using Pug template engine to render website pages on the server side
app.set('view engine', 'pug') // Express automatically supports
// Pug templates are called views in Express
app.set('views', path.join(__dirname, './views')) //Define folder where our views are located in
// path.join helps to free us from the hassle of thinking about slashes in path


/* GLOBAL MIDDLEWARE STACK */

// Serving Static files
// app.use(express.static(`${__dirname}/public`)) // This middleware helps to access static files like html, img etc from a folder
// We don't need to specify '/public/' in our url since Node will look in public repository automatically when it could not find the requested route
app.use(express.static(path.join(__dirname, 'public')))

// Set Security HTTP headers
app.use(helmet())

// Log below middleware only if the app is in development and not in production
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')) 
}
// We have access to env variables in all the files since all are in the same process

// Creating a middleware to detect and prevent brute force attacks(many requests at same time from a single IP address)
const limiter = rateLimit({
    max: 100,
    windowMs: 60*60*1000,
    message: 'Too many requests from this IP, please try again in 1 hour'
}) // Allowing 100 requests from the same IP in one hour
app.use('/api', limiter)

// Body Parser - Reading data from the body into req.body
app.use(express.json({ limit: '10kb' })) // Accept body with size <10kb only

// Parsing data from HTML form(updating user name and email)
app.use(express.urlencoded({ extended: true, limit: '10kb' })) // The way that the form sends data to the server is called URL encoded

// Parsing data from cookies
app.use(cookieParser())


// Middleware for Data Sanitization - Prevent from attack of malicious code(NOSQL Query injection) after reading data from req.body
// Eg of malicious code in body: {"email": {"$gt": ""}} - Always true (select all users)
app.use(mongoSanitize()) // This will filter out all '$' and '.' from request.body and request.params

// Middleware for Data Sanitization - Prevent from croos-site scripting attacks(XSS)
app.use(xss()) // clean user input from malicious html code

// Middleware to prevent http parameter pollution
// Eg of PP - ?sort=price&sort=duration (Multiple sorts)
app.use(hpp({
    whiteList: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'] 
    // Array of properties for which we allow duplicate fields 
})) // This will clear multiple parameter and work according to only last of them(last sort)

// Compression middleware - Works only for text and not images
app.use(compression())


// Test Middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString()
    // console.log(req.headers) // Accessing http headers in express
    //console.log(req.cookies)
    next() 
})


/* ROUTES */

app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

// If a request is not defined in our routes, express automatically sends a html response with 404 error
// Add a middleware after all routes to catch the requests not defined in our routes and send a json response
// This should handle all undefined requests whether it is a get, post, patch or delete request
app.all('*', (req, res, next) => {
    /*res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    })*/
    /*
    const err = new Error(`Can't find ${req.originalUrl} on this server!`)
    err.status = 'fail'
    err.statusCode = 404
    next(err)
    */
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

/*
// Build a Global Error Handling Middleware which will handle all operational errors at one place whether it is coming from Controllers, Routes or Models
// By specifying below 4 parameters in our middleware function, Express automatically knows that the function is a error handling middleware
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'
    
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    })
})
*/
app.use(globalErrorHandler)

module.exports = app



