const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth.middleware");
const { createAccount } = require("../controllers/account.controller");

/**
 * - POST /api/accounts/
 * - Create a new account
 * Protected Route - using authMiddleware
 */
router.post("/", authMiddleware, createAccount);

module.exports = router;
