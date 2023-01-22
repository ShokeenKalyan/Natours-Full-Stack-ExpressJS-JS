// Extend the built-in error class to handle all operational errors(predictable errors, Eg- Wrong request/url path)

class AppError extends Error {
    constructor(message, statusCode) {
        // Call the parent constructor
        // Built in Error class accepts only message
        super(message)

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true

        Error.captureStackTrace(this, this.constructor) // To ensure that the constructor function call is not going to be added in call stack wheneve a new AppError instance is created
    } 
}

module.exports = AppError