const User = require("../models/User");

const crypto = require("crypto");

const nodemailer = require("nodemailer");

// ฟังก์ชันส่งอีเมล
async function sendEmail({ to, subject, text }) {
  // กำหนด transport (ตัวอย่างใช้ Gmail)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // อีเมลผู้ส่ง
      pass: process.env.EMAIL_PASS, // รหัสผ่านแอป (App Password)
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions);
}

exports.register = async (req, res, next) => {
  try {
    console.log(req.body);
    const { name, email, telephone, password, role } = req.body;

    // Check if all required fields are provided
    if (!name || !email || !telephone || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: name, email, telephone, and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      telephone,
      password,
      role,
    });
    // const token = user.getSignedJwtToken();
    // res.status(200).json({ success: true, token});
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.log(err.stack);

    // Handle validation errors
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors)
        .map((val) => val.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No user found with that email" });
    }

    // สร้าง token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 นาที
    await user.save({ validateBeforeSave: false });

    // ส่งอีเมลจริงด้วย nodemailer
    const baseUrl = `http://localhost:${process.env.PORT || "5000"}`;
    const resetUrl = `${baseUrl}/api/v1/auth/resetpassword/${resetToken}`;
    const message = `คุณได้รับคำขอรีเซ็ตรหัสผ่าน กรุณาคลิกลิงก์นี้เพื่อรีเซ็ตรหัสผ่าน: ${resetUrl}`;
    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      });
      res
        .status(200)
        .json({ success: true, data: "Email sent with reset link" });
    } catch (err) {
      // ถ้าส่งอีเมลไม่สำเร็จ ลบ token ออก
      console.log(err.stack);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res
        .status(500)
        .json({ success: false, message: "Email could not be sent" });
    }
  } catch (err) {
    console.log(err.stack);
    res
      .status(500)
      .json({ success: false, message: "Server error during forgot password" });
  }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.log(err.stack);
    res
      .status(500)
      .json({ success: false, message: "Server error during reset password" });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // const token = user.getSignedJwtToken();
    // res.status(200).json({ success: true, token });
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  try {
    const token = user.getSignedJwtToken();

    // Default to 30 days if JWT_COOKIE_EXPIRE is not set or invalid
    const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE) || 30;

    const options = {
      expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") {
      options.secure = true;
    }

    res
      .status(statusCode)
      .cookie("token", token, options)
      .json({ success: true, token });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      success: false,
      message: "Error generating authentication token",
    });
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      success: false,
      message: "Server error retrieving user data",
    });
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      data: { message: "Logout successful" },
    });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};
