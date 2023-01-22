

class APIFeatures {
    constructor(query, queryString) {
        // query object from mongoose, queryString from Express
        this.query = query
        this.queryString = queryString
    }

    filter() {
        // 1A) Filtering
        
        const queryObj = {...this.queryString}
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryObj[el])

        // 1B) Advanced Filtering
        
        let queryStr = JSON.stringify(queryObj) 
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`) // \b is for matching exact keywords and /g means that it will happen multiple times
        //console.log(JSON.parse(queryStr))

        this.query = this.query.find(JSON.parse(queryStr))

        return this // This will return a object which allows us to chain methods to an instance of the class
    }

    sort() {
        if (this.queryString.sort) {
            //console.log(req.query.sort)
            const sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        }
        else {
            this.query = this.query.sort('-createdAt') 
        }
        return this
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields) 
        } 
        else {
            this.query = this.query.select('-__v')
        }
        return this
    }

    paginate() {
        const page = this.queryString.page*1 || 1 
        const limit = this.queryString.limit*1 || 100
        const skip = (page-1)*limit

        this.query = this.query.skip(skip).limit(limit) 
        
        return this
    }
}

module.exports = APIFeatures