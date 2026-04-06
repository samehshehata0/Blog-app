const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserPosts,
} = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate, updateUserSchema } = require("../utils/validation");

// All user routes require authentication
router.use(protect);

// GET /api/users
router.get("/", restrictTo("admin", "super-admin"), getAllUsers);

// GET /api/users/:id
router.get("/:id", getUserById);

// GET /api/users/:id/posts
router.get("/:id/posts", getUserPosts);

// PUT /api/users/:id
router.put("/:id", validate(updateUserSchema), updateUser);

// DELETE /api/users/:id
router.delete("/:id", deleteUser);

module.exports = router;
