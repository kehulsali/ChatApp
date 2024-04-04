const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  fullname: {
    type: String,
    requied: true,
  },
  email: {
    type: String,
    requied: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
});

const Users = mongoose.model("User", userSchema);
module.exports = Users;
