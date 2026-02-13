const express = require("express");
const {
  authMiddleware,
  systemAuthMiddleware,
} = require("../middlewares/auth.middleware");
const {
  createTransaction,
  createInitialFund,
} = require("../controllers/transaction.controller");
const router = express.Router();

router.post("/", authMiddleware, createTransaction);

/**
 * POST - /api/transactions/system/initial-funds
 * Create initial funds for system
 */
router.post("/system/initial-funds", systemAuthMiddleware, createInitialFund);

module.exports = router;
