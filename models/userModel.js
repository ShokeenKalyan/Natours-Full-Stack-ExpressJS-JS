const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email id'],
        unique: true,
        lowercase: true, // Not a validator but transforms the email into lowercase
        validate: [validator.isEmail, 'Please provide a valid email'] 
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'], // user roles
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // So that password never shows in any output
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE!
            validator: function(el) {
                return el === this.password // Check if passwordConfirm matches the password
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})


// Implementing Password Encryption - Password should never be stored as plain text in Database
// Using a pre save document middleware - Encrypt the password b/w receiving the data & persisting it to the DB
userSchema.pre('save', async function(next) {
    // Implement only after update or create
    // isModified is a method that can be used when a certain field has been modified
    if (!this.isModified('password')) return next() // If password not modified, then simply return

    // Hashing(Encrypting the Data) using bcrypt algorithm
    this.password = await bcrypt.hash(this.password, 12) // 12 is a cost parameter - how CPU intensive this operation would be; Higher it is, stronger would be encryption
    // Even if passwords are same for different users, the encrypted passwords would be different
    // hash is a asycnhronous method

    // Delete the confirmPassword field as we only have real password hashed. After validation, there is no need to keep it in the DB
    this.passwordConfirm = undefined
    next()
})

// Middleware to change the changedPasswordAt property after changing password
userSchema.pre('save', function(next) {
    // If the password is not modified or if the document is new, then return
    if (!this.isModified('password') || this.isNew) return next() 

    this.passwordChangedAt = Date.now() - 1000 // Subtracting 1 sec since saving to DB after token being issued may get delayed
    next()
})


// Query Middleware to filter out users with active set to 'true'
userSchema.pre(/^find/, function(next) {
    // this points to current query
    this.find({active: { $ne: false }})
    next()
})


// Creating instance method - Available for all documents in a collection
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    // Here candidatePassword is not hashed - it is coming from user. But userPassword is hashed
    return await bcrypt.compare(candidatePassword, userPassword)
}

// Create a instance method to check if password was changed
userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
    if (this.passwordChangedAt) {
        // If password was changed, then this property will be true
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000, 10) // Parsing to Integer with Base 10 
        // console.log(this.passwordChangedAt, JWTTimeStamp)
        return JWTTimeStamp < changedTimestamp // If the time at whic token was issued is less than the time of password change
    }
    return false // default - No change in password
}

userSchema.methods.createPasswordResetToken = function() {
    // Reset password does not need to be cryptographically strong as password hash that we created before
    const resetToken = crypto.randomBytes(32).toString('hex') // crate a reset password using built-in crypto module
    // Just like password, we should never store a reset password as it is in the DB. We need to encrypt it
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetExpires = Date.now() + 10*60*1000 // reset password expires in 10 min
    console.log(resetToken, this.passwordResetToken)
    return resetToken // return the unencrypted password to be sent via email
}

const User = mongoose.model('User', userSchema)

module.exports = User