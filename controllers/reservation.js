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

        //General users can see only their Reservations
        if (req.user.role !== "admin") {
            query = Reservation.find({ user: req.user.id }).populate({
                path: "restaurant",
                select: "name province tel",
            });
        } else {
            //Admin can see all Reservations
            if (req.params.RestaurantId) {
                // เปลี่ยนจากการค้นหาทั้งหมดเป็นค้นหาเฉพาะ Restaurant ที่ระบุ
                query = Reservation.find({
                    restaurant: req.params.RestaurantId,
                }).populate({
                    path: "restaurant",
                    select: "name province tel",
                });
            } else {
                query = Reservation.find().populate({
                    path: "restaurant",
                    select: "name province tel",
                });
            }
        }

        const reservations = await query;
        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Cannot find Reservation",
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
                .status(400)
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

        reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({ success: true, data: Reservation });
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
        const Reservation = await Reservation.findById(req.params.id);

        if (!Reservation) {
            return res
                .status(400)
                .json({ success: false, message: "No Reservation found" });
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
            });
        }

        await Reservation.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Cannot delete Reservation",
        });
    }
};
