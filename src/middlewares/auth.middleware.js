const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const blackListModel = require("../models/blacklist.model");

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access!!",
    });
  }

  const isBlackListed = await blackListModel.findOne({ token });

  if (isBlackListed) {
    return res.status(401).json({
      message: "Unauthorized access, token is blacklisted",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userId);

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access!!",
    });
  }
}

async function systemAuthMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing",
    });
  }

  const isBlackListed = await blackListModel.findOne({ token });

  if (isBlackListed) {
    return res.status(401).json({
      message: "Unauthorized access, token is blacklisted",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userId).select("+systemUser");

    if (!user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access. Not a system User",
      });
    }

    req.user = user;

    return next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }
}

module.exports = { authMiddleware, systemAuthMiddleware };
