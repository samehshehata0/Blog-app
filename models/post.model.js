const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      minlength: [10, "Content must be at least 10 characters"],
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          fileId: { type: String }, // ImageKit file ID for deletion
        },
      ],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "At least one image is required",
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    // Bonus: likes
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Full-text search index
postSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model("Post", postSchema);
