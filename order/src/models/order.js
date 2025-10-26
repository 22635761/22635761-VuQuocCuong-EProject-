const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  user: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'orders' });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;