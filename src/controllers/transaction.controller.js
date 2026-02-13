const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");
const emailService = require("../services/email.service");

/**
 * - Create a new transaction
 * 10 - STEP TRANSFER FLOW
 * 1. Validate Request
 * 2. Validate Idempotency Key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transacrion (PENDING - default)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction as COMPLETE
 * 9. Commit MongoDB Session
 * 10. Send email notifications
 */

const createTransaction = async (req, res) => {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  /**
   * Step 1 - Validating Request
   */
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message:
        "Your Request Contains Missing Fields (fromAccount, toAccount, amount, idempotencyKey)",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  /**
   * STEP 2 - Validate Idempotency Key
   */
  const transactionExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (transactionExists) {
    if (transactionExists.status == "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already completed",
        transaction: transactionExists,
      });
    }

    if (transactionExists.status == "PENDING") {
      return res.status(200).json({
        message: "Transaction is still processing",
      });
    }

    if (transactionExists.status == "FAILED") {
      return res.status(500).json({
        message: "Transaction processing failed",
      });
    }

    if (transactionExists.status == "REVERSED") {
      return res.status(500).json({
        message: "Transaction was reversed. Try again",
      });
    }
  }

  /**
   * 3. Check account status
   */
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message: "Inactive fromAccount or toAccount",
    });
  }

  /**
   * 4. Deriving Sender Balance from ledger
   */
  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
    });
  }

  /**
   * 5. Creating a transaction (PENDING State)
   */
  let transaction;
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session },
    )[0];

    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 100 * 1000));
    })();

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    // transaction.status = "COMPLETED";
    // await transaction.save({ session });

    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await transactionModel.findOneAndUpdate(
      { idempotencyKey: idempotencyKey },
      { status: "FAILED" },
    );

    return res.status(500).json({
      message:
        "Transaction is pending due to some error, please try again after sometime",
      error: error.message,
    });
  }

  /**
   * 10 - Sending email confirmation
   */
  await emailService.sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toAccount._id,
  );

  return res.status(201).json({
    message: "Transaction successfully completed",
    transaction: transaction,
  });
};

const createInitialFund = async (req, res) => {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "Missing toAccount, amount or idempotencyKey",
    });
  }

  const toUserAccount = await accountModel.findOne({ _id: toAccount });
  if (!toUserAccount) {
    return res.status(400).json({
      message: "Invalid toAccount",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System user account not found",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "Initial funds transaction completed",
    transaction: transaction,
  });
};

module.exports = { createTransaction, createInitialFund };
