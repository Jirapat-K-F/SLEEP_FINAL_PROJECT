const Reservation = require("../models/Reservation");

const Restaurant = require("../models/Restaurant");
//@desc Get all Reservations
//@route GET /api/v1/Reservations
//@access Public
exports.getReservations = async (req, res, next) => {
    try {
        // เพิ่มการตรวจสอบ req.user
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "User not authenticated" });
        }

        let query;
        let baseQuery = {};

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ["select", "sort", "page", "limit"];

        // Loop over removeFields and delete them from reqQuery
        removeFields.forEach((param) => delete reqQuery[param]);
        console.log(reqQuery);

        // Create query string from filtered reqQuery
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(
            /\b(gt|gte|lt|lte|in)\b/g,
            (match) => `$${match}`
        );
        let parsedQuery = JSON.parse(queryStr);

        // Clean and convert date strings to proper Date objects
        Object.keys(parsedQuery).forEach(key => {
            if (key.includes('resvDate') || key.includes('createdAt')) {
                if (typeof parsedQuery[key] === 'string') {
                    // Remove newlines and trim
                    parsedQuery[key] = parsedQuery[key].trim();
                    // Convert to Date object if it's a valid date string
                    if (parsedQuery[key] && !isNaN(new Date(parsedQuery[key]))) {
                        parsedQuery[key] = new Date(parsedQuery[key]);
                    }
                } else if (typeof parsedQuery[key] === 'object' && parsedQuery[key] !== null) {
                    // Handle MongoDB operators like $gte, $lte
                    Object.keys(parsedQuery[key]).forEach(operator => {
                        if (typeof parsedQuery[key][operator] === 'string') {
                            parsedQuery[key][operator] = parsedQuery[key][operator].trim();
                            if (parsedQuery[key][operator] && !isNaN(new Date(parsedQuery[key][operator]))) {
                                parsedQuery[key][operator] = new Date(parsedQuery[key][operator]);
                            }
                        }
                    });
                }
            }
        });

        // Fix the query structure - convert string-based MongoDB operators to proper object structure
        const properQuery = {};
        Object.keys(parsedQuery).forEach(key => {
            if (key.includes('[$') && key.includes(']')) {
                // Extract field name and operator
                const fieldMatch = key.match(/^(.+)\[\$(.+)\]$/);
                if (fieldMatch) {
                    const fieldName = fieldMatch[1];
                    const operator = `$${fieldMatch[2]}`;
                    
                    if (!properQuery[fieldName]) {
                        properQuery[fieldName] = {};
                    }
                    properQuery[fieldName][operator] = parsedQuery[key];
                }
            } else {
                properQuery[key] = parsedQuery[key];
            }
        });

        parsedQuery = properQuery;

        //General users can see only their Reservations
        if (req.user.role !== "admin") {
            baseQuery = { user: req.user.id, ...parsedQuery };
        } else {
            //Admin can see all Reservations
            if (req.params.restaurantId) {
                baseQuery = { restaurant: req.params.restaurantId, ...parsedQuery };
            } else {
                baseQuery = { ...parsedQuery };
            }
        }

        query = Reservation.find(baseQuery).populate({
            path: "restaurant",
            select: "name province tel address district region",
        }).populate({
            path: "user",
            select: "name email telephone",
        });

        //Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(",").join(" ");
            query = query.select(fields);
        }

        //Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }

        //Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;

        const total = await Reservation.countDocuments(baseQuery);
        query = query.skip(startIndex).limit(limit);

        //Executing query
        const reservations = await query;

        //Pagination result
        const pagination = {};
        const endIndex = page * limit;

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit,
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit,
            };
        }

        res.status(200).json({
            success: true,
            count: reservations.length,
            total: total,
            pagination,
            data: reservations,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: "restaurant",
            select: "name province tel",
        });
        if (!reservation) {
            return res
                .status(404)
                .json({ success: false, message: "No Reservation found" });
        }
        res.status(200).json({ success: true, data: reservation });
    } catch (err) {
        console.log(err);
        res.status(400).json({
            success: false,
            message: "Cannot find Reservation",
        });
    }
};

exports.addReservation = async (req, res, next) => {
    try {
        req.body.restaurant = req.params.restaurantId;
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: ` No restaurant with the id of ${req.params.restaurantId}`,
            });
        }
        req.body.user = req.user.id;
        const existedReservation = await Reservation.find({
            user: req.user.id,
        });
        if (existedReservation.length >= 3 && req.user.role !== "admin") {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 reservations`,
            });
        }
        const reservation = await Reservation.create(req.body);
        res.status(200).json({
            success: true,
            data: reservation,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Cannot create Reservation",
        });
    }
};

exports.updateReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);
        if (
            reservation.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "User " +
                    req.user.id +
                    " is not authorized to update this Reservation",
            });
        }
        if (!reservation) {
            return res
                .status(400)
                .json({ success: false, message: "No Reservation found" });
        }
        reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({ success: true, data: reservation });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Cannot update Reservation",
        });
    }
};

exports.deleteReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res
                .status(400)
                .json({ success: false, message: "No Reservation found" });
        }

        if (
            reservation.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "User " +
                    req.user.id +
                    " is not authorized to delete this Reservation",
            });
        }

        await Reservation.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Cannot delete Reservation",
        });
    }
};
