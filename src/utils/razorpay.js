const Razorpay = require("razorpay");

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });
  }
  return razorpayInstance;
}

module.exports = { getRazorpay };
