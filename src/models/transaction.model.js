const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "Transaction must be associated with an account"],
    index: true,
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "Transaction must be associated with an account"],
    index: true,
  },
  status: {
    type: String,
    enum: {
      values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED",
    },
    default: "PENDING",
  },
  amount: {
    type: String,
    required: [true, "Amount is required for creating a transaction"],
    min: [1, "Transaction amount cannot be negative or 0"],
  },
  idempotentKey: {
    type: String,
    required: [true, "Idempotency key is required for creating a transaction"],
    index: true,
    unique: true
  }
}, {
  timestamps: true
});

const transactionModel = mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;
