const mongoose = require("mongoose");

const connectDB = async () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("MongoDB Connected...");
    })
    .catch((err) => {
      console.log("Error connecting to MongoDB");
      process.exit(1); // Indicates to stop the server immediately
    });
};


module.exports = connectDB;