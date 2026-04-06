const Joi = require("joi");

// ─── Auth ─────────────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("user", "admin", "super-admin"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  role: Joi.string().valid("user", "admin", "super-admin"),
}).min(1);

// ─── Posts ────────────────────────────────────────────────────────────────────
const createPostSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(10).required(),
  group: Joi.string().hex().length(24), // optional group ObjectId
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  content: Joi.string().min(10),
}).min(1);

// ─── Groups ───────────────────────────────────────────────────────────────────
const createGroupSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500),
  admins: Joi.array().items(Joi.string().hex().length(24)),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().max(500),
}).min(1);

const memberActionSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});

const permissionActionSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  grant: Joi.boolean().required(),
});

// ─── Comments ─────────────────────────────────────────────────────────────────
const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
});

// ─── Validate helper middleware factory ──────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    return res.status(400).json({ status: "fail", message });
  }
  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateUserSchema,
  createPostSchema,
  updatePostSchema,
  createGroupSchema,
  updateGroupSchema,
  memberActionSchema,
  permissionActionSchema,
  createCommentSchema,
};
