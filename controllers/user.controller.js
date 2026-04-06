const User = require("../models/user.model");
const Post = require("../models/post.model");
const AppError = require("../utils/AppError");

// ─── Get All Users ────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get User By ID ───────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    res.status(200).json({ status: "success", data: { user } });
  } catch (err) {
    next(err);
  }
};

// ─── Update User ──────────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only the user themselves or super-admin can update
    if (req.user.role !== "super-admin" && req.user._id.toString() !== id) {
      return next(new AppError("You can only update your own profile.", 403));
    }

    // Prevent role escalation unless super-admin
    if (req.body.role && req.user.role !== "super-admin") {
      return next(new AppError("You cannot change your own role.", 403));
    }

    const user = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) return next(new AppError("User not found.", 404));

    res.status(200).json({ status: "success", data: { user } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete User ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only the user themselves or super-admin can delete
    if (req.user.role !== "super-admin" && req.user._id.toString() !== id) {
      return next(new AppError("You can only delete your own account.", 403));
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return next(new AppError("User not found.", 404));

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    next(err);
  }
};

// ─── Get User's Posts ─────────────────────────────────────────────────────────
const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: id })
      .populate("author", "username email")
      .populate("group", "name")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ author: id });

    res.status(200).json({
      status: "success",
      results: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { posts },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getUserPosts };
