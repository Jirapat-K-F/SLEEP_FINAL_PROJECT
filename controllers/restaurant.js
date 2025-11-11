const Restaurant = require("../models/Restaurant")
const Reserve = require("../models/Reservation")
//@desc Get all restaurants
//@route GET /api/v1/restaurants
//@access Public
exports.getRestaurants = async (req, res, next) => {
    try {
        let query
        const reqQuery = { ...req.query }
        const removeFields = ["select", "sort", "page", "limit"]
        removeFields.forEach((param) => delete reqQuery[param])
        console.log(reqQuery)
        let queryStr = JSON.stringify(req.query)
        queryStr = queryStr.replace(
            /\b(gt|gte|lt|lte|in)\b/g,
            (match) => `$${match}`
        )
        query = Restaurant.find(JSON.parse(queryStr)).populate("reservations")
        const restaurant = await Restaurant.findById(req.params.restaurantId)
        //Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(",").join(" ")
            query = query.select(fields)
        }
        //Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ")
            query = query.sort(sortBy)
        } else {
            query = query.sort("-createdAt")
        }
        //Pagination
        const page = parseInt(req.query.page, 10) || 1
        const limit = parseInt(req.query.limit, 10) || 25
        const startIndex = (page - 1) * limit

        const total = await Restaurant.countDocuments()
        query = query.skip(startIndex).limit(limit)
        //Executing query
        const restaurants = await query
        //Pagination result
        const pagination = {}
        if (req.query.select) {
            pagination.next = {
                page: page + 1,
                limit,
            }
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit,
            }
        }
        if (!restaurants) {
            return res
                .status(400)
                .json({ success: false, message: "No restaurant found" })
        }
        // Delete all reservations related to the restaurant
        await Reserve.deleteMany({ restaurant: req.params.restaurantId })
        await Restaurant.deleteOne({ _id: req.params.restaurantId })
        res.status(200).json({
            success: true,
            count: restaurants.length,
            pagination,
            data: restaurants,
        })
    } catch (err) {
        res.status(400).json({ success: false })
    }
}

//@desc Get restaurants
//@route GET /api/v1/restaurants/:id
//@access Public
exports.getRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
        if (!restaurant) {
            return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: restaurant })
    } catch (err) {
        res.status(400).json({ success: false })
    }
}

//@desc Create new restaurants
//@route POST /api/v1/restaurants
//@access private
exports.createRestaurants = async (req, res, next) => {
    const restaurant = await Restaurant.create(req.body)
    res.status(201).json({ success: true, data: restaurant })
}

//@desc Update restaurants
//@route PUT /api/v1/restaurants/:id
//@access Private
exports.updateRestaurants = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        )

        if (!restaurant) {
            return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: restaurant })
    } catch (err) {
        res.status(400).json({ success: false })
    }
}

//@desc Delete restaurants
//@route DELETE /api/v1/restaurants/:id
//@access Private
exports.deleteRestaurants = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findByIdAndDelete(req.params.id)
        if (!restaurant) {
            return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: {} })
    } catch (err) {
        res.status(400).json({ success: false })
    }
}
