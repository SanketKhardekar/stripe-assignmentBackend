const mongoose = require("mongoose");
//Mondo db Schema for Orders
const orderSchema = new mongoose.Schema(
  {
    userId: { type: Number, require: [true, "Please Provide UserId"] },
    customerId:{type:String},
    customerName: { type: String, require: [true, "Please Provide Customer Name"] },
    products: [
      {
        id: { type: Number },
        name: { type: String },
        description: { type: String },
        price: { type: Number },
        image: { type: String },
        quantity: { type: Number },
      },
    ],
    total: { type: Number, require: [true, "Please Provide Total Price"] },
    deliveryStatus: { type: String, default: "pending" },
    paymentStatus: {
      type: String,
      require: [true, "Please Provide Payment Status"],
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
