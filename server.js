const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './config.env'})

// Catching uncaught exceptions - errors in synchronous code that are not handeled anywhere
// This needs to be placed on top. Otherwise, it won't be able to catch any synchronous bug
process.on('uncaughtException', err => {
    console.log('Uncaught Exception! Shutting Down...')
    console.log(err.name, err.message)
    process.exit(1)
})

const app = require('./app.js')

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(con => {
    console.log('DB connection successful')
})


const port = process.env.PORT || 3000 // Setting port to process.env.PORT is mandotory for deployment via Heroku
const server = app.listen(port, () => {
    console.log(`App running on Port : ${port}`)
})

// Handling global unhandeled rejections of asynchronous code

// Listening to an event whenever a promise gets rejected globally
process.on('unhandledRejection', err => {
    console.log('Unhandeled Rejection! Shutting Down...')
    console.log(err.name, err.message)
    // Close the application gracefully (Close the server before exiting the application)
    server.close( () => {
        process.exit(1) // 0 stands for success and 1 stands for uncaught exception
    })
})

// Below code is to prevent hanging requests that can happen due to heroku's feature of re-starting apps in 24hr cycle to keep our app in a healthy state
// Heroku doses this by emitting an event called 'Sick Term Signal'
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully')
    server.close(() => {
        console.log('Process terminated')
        // No need of process.exit because the SIGTERM itself will cause the application to shut down
    })
})

