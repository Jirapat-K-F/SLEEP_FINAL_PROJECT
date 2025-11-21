const mongoose = require("mongoose");
// Create Schema
const RestaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add a name"],
            unique: true,
            trim: true,
            maxlength: [50, "Name can not be more than 50 characters"],
        },
        address: {
            type: String,
            required: [true, "Please add an address"],
        },
        district: {
            type: String,
            required: [true, "Please add a district"],
        },
        province: {
            type: String,
            required: [true, "Please add a province"],
        },
        postalcode: {
            type: String,
            required: [true, "Please add a postal code"],
            maxlength: [5, "Postal code can not be more than 5 characters"],
        },
        tel: {
            type: String,
        },
        region: {
            type: String,
            required: [true, "Please add a region"],
        },
        openTime: {
            type: String,
            default: "09:00", // Default opening time
            required: [true, "Please add opening time"],
            validate: {
                validator: function (v) {
                    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: "Please provide valid time format (HH:MM)",
            },
        },
        closeTime: {
            type: String,
            default: "22:00", // Default closing time
            required: [true, "Please add closing time"],
            validate: {
                validator: function (v) {
                    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: "Please provide valid time format (HH:MM)",
            },
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Reverse populate with virtuals
RestaurantSchema.virtual("reservations", {
    ref: "Reservation",
    localField: "_id",
    foreignField: "restaurant",
    justOne: false,
});

module.exports = mongoose.model("Restaurant", RestaurantSchema);
