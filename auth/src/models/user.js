const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { collection: "users" } // đảm bảo lưu vào collection 'users'
);

module.exports = mongoose.model("User", UserSchema);
