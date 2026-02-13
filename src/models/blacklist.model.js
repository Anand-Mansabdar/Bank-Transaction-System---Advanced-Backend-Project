const mongoose = require("mongoose");

const blackListSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "Token is required to blacklist"],
      unique: [true, "Token already blacklisted"],
    },
  },
  { timestamps: true },
);

blackListSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 3, // 3 days
  },
);

const blackListModel = mongoose.model("tokenblacklist", blackListSchema);

module.exports = blackListModel;
