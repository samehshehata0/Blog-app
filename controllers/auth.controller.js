const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/jwt");

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Prevent registering as super-admin through public route
    const safeRole = role === "super-admin" ? "user" : role || "user";

    const user = await User.create({ username, email, password, role: safeRole });

    const token = signToken({ id: user._id, role: user.role });

    res.status(201).json({
      status: "success",
      token,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid email or password.", 401));
    }

    const token = signToken({ id: user._id, role: user.role });

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      status: "success",
      token,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
