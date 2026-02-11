const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

const emailService = require("../services/email.service");

// API - POST -> /api/auth/register
const registerUserController = async (req, res) => {
  const { email, password, name } = req.body;

  const userExists = await userModel.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({
      message: "User already exists with this email.",
      status: "failed",
    });
  }

  const user = await userModel.create({
    email,
    password,
    name,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token: token,
  });

  await emailService.sendRegistrationEmail(user.email, user.name)
};

const loginUserController = async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email: email }).select("+password");

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  return res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token: token,
  });
};

module.exports = {
  registerUserController,
  loginUserController,
};
