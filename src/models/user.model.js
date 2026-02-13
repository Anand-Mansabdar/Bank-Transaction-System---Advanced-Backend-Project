const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creating a user"],
      trim: true,
      lowercase: true,
      match: [emailRegex, "Invalid email address"],
      unique: [true, "Email already registered"],
    },
    name: {
      type: String,
      required: [true, "Username is required for creating an account"],
    },
    password: {
      type: String,
      required: [true, "Password is required for creating an account"],
      minlength: [6, "Password must atleast contain 6 characters"],
      select: false,
    },
    systemUser: {
      type: Boolean,
      default: false,
      immutable: true,
      select: false
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;

  return;
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
