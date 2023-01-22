
// Controller to catch asynchronous errors
module.exports = fn => {
    return (req, res, next) => {
    // Catch the error using .catch() on a rejected promise
    // fn(req, res, next).catch(err => next(err)) // catch block of controller function transferred here
    fn(req, res, next).catch(next)
}
}
