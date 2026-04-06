const express = require("express");
const router = express.Router();
const {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
} = require("../controllers/comment.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate, createCommentSchema } = require("../utils/validation");

router.use(protect);

// GET  /api/comments/post/:postId   - get all comments for a post
// POST /api/comments/post/:postId   - create a comment on a post
router
  .route("/post/:postId")
  .get(getPostComments)
  .post(validate(createCommentSchema), createComment);

// PUT    /api/comments/:id  - update comment
// DELETE /api/comments/:id  - delete comment
router
  .route("/:id")
  .put(validate(createCommentSchema), updateComment)
  .delete(deleteComment);

module.exports = router;
