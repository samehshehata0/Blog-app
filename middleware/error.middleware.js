const AppError = require("../utils/AppError");

// ─── Handle specific Mongoose / JWT errors ───────────────────────────────────

const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}.`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate value for field '${field}'. Please use another value.`, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${errors.join(". ")}`, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

// ─── Global Error Middleware ──────────────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let error = { ...err, message: err.message };

  if (err.name === "CastError") error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError") error = handleValidationErrorDB(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  // Operational, trusted errors: send message to client
  if (error.isOperational || err.isOperational) {
    return res.status(error.statusCode || err.statusCode).json({
      status: error.status || err.status,
      message: error.message,
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error("💥 Unexpected Error:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong. Please try again later.",
  });
};

module.exports = globalErrorHandler;
