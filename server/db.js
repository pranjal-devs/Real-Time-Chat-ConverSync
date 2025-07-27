const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb+srv://Pranjal:QJghEdDkm3hxSp7l@cluster0.4wkxo.mongodb.net/conversync-chat-app");

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20
  },
  fullname: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

const UserModel = mongoose.model("User", userSchema);

module.exports = {
  UserModel
};