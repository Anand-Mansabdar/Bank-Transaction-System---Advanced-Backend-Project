const express = require("express");
const {
  registerUserController,
  loginUserController,
  logoutController,
} = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { getAccountBalance } = require("../controllers/account.controller");

const router = express.Router();

router.post("/register", registerUserController);

router.post("/login", loginUserController);

router.post("/logout", logoutController);

module.exports = router;
