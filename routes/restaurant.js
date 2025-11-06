const express = require("express")
const {
    getRestaurants,
    getRestaurant,
    createRestaurants,
    updateRestaurants,
    deleteRestaurants,
} = require("../controllers/restaurants")

const appointmentRouter = require("./appointments")

const router = express.Router()
router.use("/:restaurantId/appointments", appointmentRouter)

const { protect, authorize } = require("../middleware/auth")
router
    .route("/")
    .get(getRestaurants)
    .post(protect, authorize("admin"), createRestaurants)
router
    .route("/:id")
    .get(getRestaurant)
    .put(protect, authorize("admin"), updateRestaurants)
    .delete(protect, authorize("admin"), deleteRestaurants)

module.exports = router
