const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const { validate, registerSchema, loginSchema } = require("../utils/validation");

// POST /api/auth/register
router.post("/register", validate(registerSchema), register);

// POST /api/auth/login
router.post("/login", validate(loginSchema), login);

module.exports = router;
