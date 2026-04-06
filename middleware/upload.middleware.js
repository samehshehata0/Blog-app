const multer = require("multer");
const AppError = require("../utils/AppError");
const imagekit = require("../config/imagekit");

// ─── Multer: store files in memory ───────────────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files (jpeg, png, gif, webp) are allowed.", 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// ─── uploadOnImageKit: upload buffered files to ImageKit ─────────────────────
const uploadOnImageKit = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError("At least one image is required.", 400));
    }

    const uploadPromises = req.files.map((file) => {
      return imagekit.upload({
        file: file.buffer,
        fileName: `${Date.now()}-${file.originalname}`,
        folder: "/blog-app/posts",
      });
    });

    const results = await Promise.all(uploadPromises);

    // Attach uploaded image data to req for controller use
    req.uploadedImages = results.map((r) => ({
      url: r.url,
      fileId: r.fileId,
    }));

    next();
  } catch (err) {
    next(new AppError(`Image upload failed: ${err.message}`, 500));
  }
};

module.exports = { upload, uploadOnImageKit };
