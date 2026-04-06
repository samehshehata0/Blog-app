const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const AppError = require("../utils/AppError");

// ─── Create Comment ───────────────────────────────────────────────────────────
const createComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return next(new AppError("Post not found.", 404));

    const comment = await Comment.create({
      content: req.body.content,
      author: req.user._id,
      post: post._id,
    });

    await comment.populate("author", "username email");

    res.status(201).json({ status: "success", data: { comment } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Comments For Post ────────────────────────────────────────────────────
const getPostComments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "username email")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ post: req.params.postId });

    res.status(200).json({
      status: "success",
      results: comments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { comments },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Update Comment ───────────────────────────────────────────────────────────
const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError("Comment not found.", 404));

    if (
      req.user.role !== "super-admin" &&
      comment.author.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("You can only edit your own comments.", 403));
    }

    comment.content = req.body.content;
    await comment.save();
    await comment.populate("author", "username email");

    res.status(200).json({ status: "success", data: { comment } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Comment ───────────────────────────────────────────────────────────
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError("Comment not found.", 404));

    if (
      req.user.role !== "super-admin" &&
      comment.author.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("You can only delete your own comments.", 403));
    }

    await comment.deleteOne();
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { createComment, getPostComments, updateComment, deleteComment };
