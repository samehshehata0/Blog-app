const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
} = require("../controllers/post.controller");
const { protect } = require("../middleware/auth.middleware");
const { upload, uploadOnImageKit } = require("../middleware/upload.middleware");
const { validate, createPostSchema, updatePostSchema } = require("../utils/validation");

// All post routes require authentication
router.use(protect);

// GET  /api/posts         - get all accessible posts (global + user's groups)
// POST /api/posts         - create post with image upload
router
  .route("/")
  .get(getAllPosts)
  .post(
    upload.array("images", 10),   // multer: accept up to 10 images
    uploadOnImageKit,              // upload to ImageKit, attach to req.uploadedImages
    validate(createPostSchema),
    createPost
  );

// GET    /api/posts/:id
// PUT    /api/posts/:id   - update post (optionally replace images)
// DELETE /api/posts/:id
router
  .route("/:id")
  .get(getPostById)
  .put(
    upload.array("images", 10),
    (req, res, next) => {
      // uploadOnImageKit only if new files were provided
      if (req.files && req.files.length > 0) return uploadOnImageKit(req, res, next);
      next();
    },
    validate(updatePostSchema),
    updatePost
  )
  .delete(deletePost);

// POST /api/posts/:id/like - toggle like
router.post("/:id/like", toggleLike);

module.exports = router;
