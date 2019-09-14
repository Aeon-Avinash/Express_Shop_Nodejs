const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  totalPrice: {
    type: Number
  },
  totalItems: {
    type: Number
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  cart: {
    items: [
      {
        product: {
          title: {
            type: String,
            required: true
          },
          price: {
            type: Number,
            required: true
          },
          description: {
            type: String
          },
          imageUrl: {
            type: String
          }
        },
        quantity: {
          type: Number
        }
      }
    ]
  }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
