const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  cart: {
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        quantity: {
          type: Number
        }
      }
    ],
    default: []
  },
  currentTransaction: {
    sessionId: String,
    confirmSignature: {
      type: Boolean,
      default: false
    },
    failureMessage: String
  },
  resetToken: {
    type: String
  },
  resetTokenExpiration: {
    type: Date
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
