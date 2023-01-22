
const multer = require('multer') // For handling file uploads
const sharp = require('sharp') // For resizing images

const AppError = require('./../Utils/appError.js')
const User = require('./../models/userModel.js')
const APIFeatures = require('./../Utils/apiFeatures.js')
const catchAsync = require('./../Utils/catchAsync.js')
const factory = require('./handlerFactory.js')

/*
// Storing the uploaded files in disk file system
const multerStorage = multer.diskStorage({
    // cb here is a clabback function similar to Express's next() function
    destination: (req, file, cb) => {
        // Syntax - cb(error, destination)
        cb(null, 'public/img/users')
    },
    filename: (req, file, cb) => {
        // Set file name to - user-6w76767ab5wr3-34242516.jpeg (user-id-timestamp.jpeg)
        const ext = file.mimetype.split('/')[1] // mimetype here would be 'image/jpeg'
        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
    }
})
*/

// Storing the image as a buffer and not in permanent disk memory since we need to perform some operations on image(resizing)
const multerStorage = multer.memoryStorage()

// Check if the uploaded file is an image
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

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next()

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg` // Putting the filename on req.file so that it can be used by updateMe controller
    
    // getting the image from memory using req.file.buffer and resizng it into a 500px*500px square
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({quality: 90}) // Reducing memory space to 90%
        .toFile(`public/img/users/${req.file.filename}`) // Finally writing the file to the disc

    next()
})

const filterObj = (obj, ...allowedFields) => {
    // ...allowedFields = array of fields to be kept in the body (name, email)
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
} 


// Middleware for getting details of a logged in user
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id // Putting user on req.params. This will then be passed to factory getOne function
    next()
}


// For updating user data by the current autheticated user himself/herself
// By standard, there are always different places for updating password and updating data
exports.updateMe = catchAsync(async (req, res, next) => {
    
    // console.log(req.files)

    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates! Please use /updateMyPassword', 400))
    }

    // 2) Filter out unawanted field names that are not allowed to be updated and then Update User document
    // Since not dealing with sensitive data like passwords, we can use findByIdAndUpdate
    // we cannot put req.body as data below since then anyone can change role to 'admin'
    // we can only allow name and email to be updated for now
    const filteredBody = filterObj(req.body, 'name', 'email')
    if ( req.file ) {
        filteredBody.photo = req.file.filename
    }
    
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new:true, runValidators: true
    })

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
})

// For allowing user to delete his account
// In actual, we do not delete his/her data, we only set the 'active' status to false
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false})

    res.status(204).json({
        status: 'success',
        data: null
    })
})


exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'err',
        message: 'This route is not yet defined! Please use /signup istead'
    })
}

exports.getAllUsers = factory.getAll(User)

exports.getUser = factory.getOne(User)

exports.updateUser = factory.updateOne(User) // Do not update passwords with this

exports.deleteUser = factory.deleteOne(User)