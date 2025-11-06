const Reservation = require("../models/Reservation")

const Restaurant = require("../models/Restaurant")
//@desc Get all Reservations
//@route GET /api/v1/Reservations
//@access Public
exports.getReservations = async (req, res, next) => {
    try {
        // เพิ่มการตรวจสอบ req.user
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "User not authenticated" })
        }

        let query

        //General users can see only their Reservations
        if (req.user.role !== "admin") {
            query = Reservation.find({ user: req.user.id }).populate({
                path: "Restaurant",
                select: "name province tel",
            })
        } else {
            //Admin can see all Reservations
            if (req.params.RestaurantId) {
                // เปลี่ยนจากการค้นหาทั้งหมดเป็นค้นหาเฉพาะ Restaurant ที่ระบุ
                query = Reservation.find({
                    Restaurant: req.params.RestaurantId,
                }).populate({
                    path: "Restaurant",
                    select: "name province tel",
                })
            } else {
                query = Reservation.find().populate({
                    path: "Restaurant",
                    select: "name province tel",
                })
            }
        }

        const Reservations = await query
        res.status(200).json({
            success: true,
            count: Reservations.length,
            data: Reservations,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            error: "Cannot find Reservation",
        })
    }
}
exports.getReservation = async (req, res, next) => {
    try {
        const Reservation = await Reservation.findById(req.params.id).populate({
            path: "Restaurant",
            select: "name province tel",
        })
        if (!Reservation) {
            return res
                .status(400)
                .json({ success: false, message: "No Reservation found" })
        }
        res.status(200).json({ success: true, data: Reservation })
    } catch (err) {
        console.log(err)
        res.status(400).json({
            success: false,
            message: "Cannot find Reservation",
        })
    }
}

exports.addReservation = async (req, res, next) => {
    try {
        req.body.user = req.user.id
        req.body.Restaurant = req.params.RestaurantId
        const Restaurant = await Restaurant.findById(req.body.Restaurant)
        if (!Restaurant) {
            return res.status(400).json({
                success: false,
                message: "No Restaurant with the id of " + req.body.Restaurant,
            })
        }
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "User not authenticated" })
        }
        const existedReservation = await Reservation.find({ user: req.user.id })
        if (existedReservation.length >= 3 && req.user.role !== "admin") {
            return res.status(400).json({
                success: false,
                message:
                    "The user with ID " +
                    req.user.id +
                    " has already made 3 Reservations",
            })
        }
        if (!req.body.Restaurant) {
            return res.status(400).json({
                success: false,
                message:
                    "Restaurant is required. Please provide Restaurant ID in request body or URL parameter.",
            })
        }
        const Reservation = await Reservation.create(req.body)
        res.status(200).json({ success: true, data: Reservation })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Cannot create Reservation",
        })
    }
}

exports.updateReservation = async (req, res, next) => {
    try {
        let Reservation = await Reservation.findById(req.params.id)
        if (
            Reservation.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "User " +
                    req.user.id +
                    " is not authorized to update this Reservation",
            })
        }
        if (!Reservation) {
            return res
                .status(400)
                .json({ success: false, message: "No Reservation found" })
        }
        Reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        )

        Reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        )

        res.status(200).json({ success: true, data: Reservation })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Cannot update Reservation",
        })
    }
}

exports.deleteReservation = async (req, res, next) => {
    try {
        const Reservation = await Reservation.findById(req.params.id)

        if (!Reservation) {
            return res
                .status(400)
                .json({ success: false, message: "No Reservation found" })
        }

        if (
            Reservation.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "User " +
                    req.user.id +
                    " is not authorized to delete this Reservation",
            })
        }

        await Reservation.deleteOne()
        res.status(200).json({ success: true, data: {} })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Cannot delete Reservation",
        })
    }
}
