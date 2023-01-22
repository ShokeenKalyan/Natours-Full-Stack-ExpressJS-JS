const crypto = require('crypto')
const {promisify} = require('util') // destructuring
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel.js')
const catchAsync = require('./../Utils/catchAsync.js')
const AppError = require('./../Utils/appError.js')
const Email = require('./../Utils/email.js')

const signToken = id => {
    // Syntax - jwt.sign(payload, secret, options)
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
    // Using Mongoose id as tha data in the payload of JWT
    // expiresIn is for logging out a user after certain period of time as a security measure
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    
    // Creating and sending a cookie(Cookie is used to make our application more secure)
    // Cookie - A small piece of text that a server can send to client. When client(browser) receives the cooke, it can automatically store and send it back with future requests to the same server
    const cookieOptions = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 *60 *1000 )), // browser will delete the cookie after it has expired
        // secure: true, // cookie will only be sent on an encrypted connection(https)
        httpOnly: true // Browser cannot access or modify the cookie
    }
    
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true
    // Syntax- res.cookie(name of cookie, data that we want to send in a cookie, options)
    res.cookie('jwt', token, cookieOptions)

    // Removing password from output
    user.password = undefined
    
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    // const newUser = await User.create(req.body) // This is flawed way since anyone can then rewrite role from the body as admin
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    }) // This ensures that we only allow the data that we actually need to be put into the new user

    const url = `${req.protocol}://${req.get('host')}/me`
    await new Email(newUser, url).sendWelcome()
    
    createSendToken(newUser, 201, res)
    /*
    const token = signToken(newUser._id)
    
    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    })
    */
})

// Logging in users- only if the email is is registered and password matches correctly
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body // Using destructuring on body object

    // 1) Check if email and password exists
    if (!email || !password) {
        return next(new AppError('Please provide email & password', 404))
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({email: email}).select('+password') // Since password will not be visible in find queries, we need to use select
    // console.log(user)
    // Compare 'pass1234' === '$2a$12$JPeZ3xYV1J1JxhqYgTii4ehQ0BoPo7gPtAFI3qlWW8Z3GW6T5pB.u' by encrypting pass1234 using bcrypt
    // const correct = await user.correctPassword(password, user.password) // correctPassword is available on all user instances
    // Move correct in the if statement below - Otherwise if user does not exit then it would not move to next line

    if (!user || !(await user.correctPassword(password, user.password))) {
        // Not specifying which is incorrect - user or password - otherwise info leaked to hacker
        return next(new AppError('Incorrect Email or Password', 401)) // 401 means 'unauthorized'
    }

    // 3) If everything is ok, send token to client
    createSendToken(user, 200, res)
})


// For loggong out the user, we have to create a cookie with the same name which will overwrite the login created cookie
// We have to do this in this way since we cannot manipulate cookies with options set to 'httpOnly'
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', { // loggedout is simply a dummy text
        // Cookie Options below
        expires: new Date(Date.now() + 10*1000),
        httpOnly: true
    })

    res.status(200).json({ status: 'success' })
} 


// Creating a new middleware function that checks if the user is logged in or not to provide access to protected routes
exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }
    else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }
    
    // console.log(token)
    
    
    if (!token) {
        return next(new AppError('You are not logged in! Please login to get access', 401))
    }

    // 2) Verifying the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist', 401))
    }

    // 4) Check if user changed password after the JWT was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please login again!', 401))
    }

    // If cleared above checks, then grant access to protected route
    req.user = currentUser // Put the user data on the request
    res.locals.user = currentUser // Put user data for use in pug templates
    next()
})


// Middleware to check if user is logged in or not
// It is not for protecting any route, it is only for rendered pages. There will be never be an error in this middleware
exports.isLoggedIn = async (req, res, next) => {
    // For rendered website, token will only be sent using the cookie and not authorization header
    //console.log(req.cookies)
    if (req.cookies.jwt) {
        // We have to perform try catch here instead of catchAsync since we ant to return from the function to next() middleare instead of going to global error handling middleware
        try {

            // 1) Verifying the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id)
            if (!currentUser) {
                return next() // No error, simply move on to next middleware
            }

            // 4) Check if user changed password after the JWT was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next()
            }

            // If cleared above checks, then there is a logged-in user- Make user accessible to our templates
            // Every pug template has access to response.locals
            res.locals.user = currentUser // Now there will be avaribale called user in pug template
            return next()
        }
        catch (err) {
            return next()
        }
}
    next() // If no cookie, move to next middleware w/o putting the user in pug template
}

// Authorization - Verifying if a certain user has the rights to interact with a certain resource (eg- delete a tour)
// Not all logged in(Authenticated) users may have authorization rights
// Middleware to restrict certain routes(deleting a tour)
// Middleware function do not accept arguments as such. So we need to create a wrapper function
exports.restrictTo = (...roles) => {
    // (...roles) represent the array of arguments ; roles = ['admin', 'lead-guide']
    // return the middleware function
    return (req, res, next) => {
        // use req.user(currentUser) from the previous middleware 'protect' called on delete rpute
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403)) // 403 means 'forbidden'
        }
        next()
    }
}

// Password reset functionality
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('There is no user with that email address', 404))
    }

    // 2. Generate the random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({validateBeforeSave: false}) // save the changes(reset and resetexpires in the document) after deactivating all the validators in schema

    // 3. Send it to user's email

    /*
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.
    If you didn't forget your password, please ignore this email.`
    */

    try {
        /*
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        })
        */

        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
        await new Email(user, resetURL).sendPasswordReset()

        res.status(200).json({
            status: 'success',
            messsage: 'Token send to email'
        })
    } catch(err) {
        // If not able to send email, then reset the token and expires property
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({validateBeforeSave: false})

        return next(new AppError('There was error sending the email. Try again later!', 500))
    }
})

exports.resetPassword =  catchAsync(async (req, res, next) => {
    // 1) Get user based on token
    // encrypt the token and compare it with the encrypted one in the DB
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    
    // Identify user by token
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}})
    // 2) if token has not expired and there is a user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save() // We wan't to run validators again(password=confirm password)

    // 3) Update changedPasswordAt for the user

    // 4) Log the user in(send JWT)
    createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get the user from collection
    // Get the user from the request object(Already logged in)
    const user = await User.findById(req.user.id).select('+password')

    // 2) Check if the POSTed password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401))
    }

    // 3) if so, update the password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()
    // User.findByIdAndUpdate will not work as intended

    // 4) Log user in, send the new JWT
    createSendToken(user, 200, res)
})
