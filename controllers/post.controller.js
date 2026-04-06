const Post = require("../models/post.model");
const Group = require("../models/group.model");
const AppError = require("../utils/AppError");
const imagekit = require("../config/imagekit");

// ─── Helper: check if user can post in a group ────────────────────────────────
const canPostInGroup = (group, userId) => {
  const id = userId.toString();
  const isAdmin = group.admins.some((a) => a.toString() === id);
  const hasPermission = group.postPermissions.some((p) => p.toString() === id);
  return isAdmin || hasPermission;
};

// ─── Create Post ──────────────────────────────────────────────────────────────
const createPost = async (req, res, next) => {
  try {
    const { title, content, group: groupId } = req.body;
    const isSuperAdmin = req.user.role === "super-admin";

    // Validate group membership & permission if posting to a group
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) return next(new AppError("Group not found.", 404));

      const isMember =
        group.members.some((m) => m.toString() === req.user._id.toString()) ||
        group.admins.some((a) => a.toString() === req.user._id.toString());

      if (!isSuperAdmin && !isMember) {
        return next(new AppError("You are not a member of this group.", 403));
      }

      if (!isSuperAdmin && !canPostInGroup(group, req.user._id)) {
        return next(
          new AppError("You do not have permission to post in this group.", 403)
        );
      }
    }

    const post = await Post.create({
      title,
      content,
      images: req.uploadedImages,
      author: req.user._id,
      group: groupId || null,
    });

    await post.populate("author", "username email");

    res.status(201).json({ status: "success", data: { post } });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Posts ────────────────────────────────────────────────────────────
// Returns global posts + group posts the user has access to, sorted by createdAt
const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Find groups the user is a member or admin of
    const userGroups = await Group.find({
      $or: [
        { members: req.user._id },
        { admins: req.user._id },
      ],
    }).select("_id");

    const accessibleGroupIds = userGroups.map((g) => g._id);

    // Build query: global posts OR posts from accessible groups
    const query = {
      $or: [
        { group: null },
        { group: { $in: accessibleGroupIds } },
      ],
    };

    // Bonus: full-text search
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await Post.find(query)
      .populate("author", "username email")
      .populate("group", "name")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

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

// ─── Get Single Post ──────────────────────────────────────────────────────────
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username email")
      .populate("group", "name admins members");

    if (!post) return next(new AppError("Post not found.", 404));

    // If post belongs to a group, verify user is a member
    if (post.group) {
      const group = post.group;
      const isMember =
        group.members.some((m) => m.toString() === req.user._id.toString()) ||
        group.admins.some((a) => a.toString() === req.user._id.toString());

      if (req.user.role !== "super-admin" && !isMember) {
        return next(
          new AppError("You do not have access to this group's post.", 403)
        );
      }
    }

    res.status(200).json({ status: "success", data: { post } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Post ──────────────────────────────────────────────────────────────
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found.", 404));

    // Only post owner or super-admin can update
    if (
      req.user.role !== "super-admin" &&
      post.author.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("You can only update your own posts.", 403));
    }

    const { title, content } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;

    // If new images uploaded, replace old ones on ImageKit then update
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      // Delete old images from ImageKit
      await Promise.allSettled(
        post.images.map((img) =>
          img.fileId ? imagekit.deleteFile(img.fileId) : Promise.resolve()
        )
      );
      post.images = req.uploadedImages;
    }

    await post.save();
    await post.populate("author", "username email");

    res.status(200).json({ status: "success", data: { post } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Post ──────────────────────────────────────────────────────────────
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found.", 404));

    // Only post owner or super-admin can delete
    if (
      req.user.role !== "super-admin" &&
      post.author.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("You can only delete your own posts.", 403));
    }

    // Delete images from ImageKit
    await Promise.allSettled(
      post.images.map((img) =>
        img.fileId ? imagekit.deleteFile(img.fileId) : Promise.resolve()
      )
    );

    await post.deleteOne();

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    next(err);
  }
};

// ─── Bonus: Toggle Like ───────────────────────────────────────────────────────
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found.", 404));

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.status(200).json({
      status: "success",
      liked: !alreadyLiked,
      likesCount: post.likes.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
};
