const AppError = require("./../Utils/appError")

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0] 
    const message = `Duplicate field value: ${value}, Please use another value!`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid Input Data. ${errors.join('. ')}`
    return new AppError(message, 400)
}

const handleJWTerror = () => new AppError('Invalid Token. Please log in again', 401)

const handleJWTExpiredError = () => new AppError('Your Token has expired. Please log in again', 401)



const sendErrorDev = (err, req, res) => {
    // originalUrl does not contain host details(127.0.0.1)
    // API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        })
    } 
    // RENDERED WEBSITE
    console.log('ERROR ', err)
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
    })    
}

const sendErrorProd = (err, req, res) => {
    // Operational, trusted error: send message to client
    
    // API
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            })
        }
    
    // Programming or other unknown error: don't leak error details
        
    // 1) Log error (for developers)
    console.error('ERROR!', err)
    
    // 2) Send generic error (for client)
    return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
    })    
    }
    
    // Rendered Website
    
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        })
    }
    
    // Programming or other unknown error: don't leak error details
    
    // 1) Log error (for developers)
    console.error('ERROR!', err)
    
    // 2) Send generic error (for client)
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later!'
    })      
}


module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res)
    }
    else if ( process.env.NODE_ENV === 'development1' ) {
    //else if ( process.env.NODE_ENV === 'production' ) {
        let error = { ...err } // Make Copy of Error Object
        error.message = err.message
        
        if (error.name === 'CastError') {
            // For MongoDB Error Type 1 : Random URL
            error = handleCastErrorDB(error)
        }
        if (error.code === 11000) {
            // For MongoDB Error Type 2: Duplicate Tour Names
            error = handleDuplicateFieldsDB(error)
        }
        if (error.name === 'ValidationError') {
            // For MongoDB Error Type 3: Validation Error
            error = handleValidationErrorDB(error)
        }
        
        if (error.name === 'JsonWebTokenError') {
            error = handleJWTerror()
        }
        if (error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError()
        }
        sendErrorProd(error, req, res)
    }    
}