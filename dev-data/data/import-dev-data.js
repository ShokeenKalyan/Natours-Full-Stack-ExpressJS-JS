const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './config.env'})

const Tour = require('./../../models/tourModel.js')
const User = require('./../../models/userModel.js')
const Review = require('./../../models/reviewModel.js')

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(con => {
    console.log('DB connection successful')
})

// Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))

// Import Data into DB
const importData = async () => {
    try {
        await Tour.create(tours)
        await User.create(users, { validateBeforeSave: false }) // To skip the validation of creating a new user without specifying passwordConfirm property
        await Review.create(reviews)

        console.log('Data successfully loaded')
    }
    catch (err) {
        console.log(err)
    }
    process.exit()
}

// Delete all data from DB
const deleteData = async () => {
    try {
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()

        console.log('Data successfully deleted')
    }
    catch (err) {
        console.log(err)
    }
    process.exit() // This stops the application
}

if ( process.argv[2] === '--import' ) {
    importData()
}
else if ( process.argv[2] === '--delete' ) {
    deleteData()
}

console.log(process.argv)