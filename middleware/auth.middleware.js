const AppError = require("../utils/AppError");
const { verifyToken } = require("../utils/jwt");
const User = require("../models/user.model");

// ─── Protect: verify JWT and attach user to req ───────────────────────────────
const protect = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("You are not logged in. Please log in to get access.", 401));
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return next(new AppError("Invalid or expired token. Please log in again.", 401));
    }

    // 3. Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError("The user belonging to this token no longer exists.", 401));
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// ─── restrictTo: role-based access control ───────────────────────────────────
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
