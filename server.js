const express = require("express")
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser")
const connectDB = require("./config/db.js")

dotenv.config({ path: "./config/config.env" })

// Connect to database
connectDB()

const app = express()
app.use(express.json()) // parse JSON body
const restaurants = require("./routes/restaurant.js")
const reservations = require("./routes/reservation.js")
const auth = require("./routes/auth")

// Mount routers
app.use("/api/v1/auth", auth)
app.use("/api/v1/restaurants", restaurants)
app.use("/api/v1/reservations", reservations)
app.use(cookieParser())

const PORT = process.env.PORT || 5000

const server = app.listen(
    PORT,
    console.log(
        "Server running in ",
        process.env.NODE_ENV,
        "mode on port",
        PORT
    )
)

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
    console.log(`Error: ${err.message}`)
    // Close server & exit process
    console.log(err)
    console.log(process.env.MONGO_URI)
    server.close(() => process.exit(1))
})
