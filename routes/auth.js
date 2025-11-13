const express = require("express")
const { register, login, getMe, logout, forgotPassword, resetPassword } = require("../controllers/auth")

const router = express.Router()

const { protect } = require("../middleware/auth")
router.post("/register", register)
router.post("/login", login)
router.post("/forgotpassword", forgotPassword)
router.put("/resetpassword/:token", resetPassword)
router.get("/me", protect, getMe)
router.get("/logout", protect, logout)
module.exports = router
