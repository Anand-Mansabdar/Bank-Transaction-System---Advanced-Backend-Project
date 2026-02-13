const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  createAccount,
  getUserAccounts,
} = require("../controllers/account.controller");

/**
 * - POST /api/accounts/
 * - Create a new account
 * Protected Route - using authMiddleware
 */
router.post("/", authMiddleware, createAccount);

/**
 * GET /api/accounts/
 * Get all accounts of the logged in users
 * Protected Route
 */
router.get("/", authMiddleware, getUserAccounts);

module.exports = router;
