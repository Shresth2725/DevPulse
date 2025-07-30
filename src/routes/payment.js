const express = require("express");
const { userAuth } = require("../middleware/auth");
const razorpayInstance = require("../utils/razorpay.js");
const paymentModel = require("../models/payment");
const { memberShipAmount } = require("../utils/constant");
const User = require("../models/user");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

const paymentRoute = express.Router();

// Create payment order
paymentRoute.post("/payment/create", userAuth, async (req, res) => {
  try {
    const plan = req.body.plan;

    const order = await razorpayInstance.orders.create({
      amount: memberShipAmount[plan],
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        memberShipType: plan,
      },
    });

    const payment = new paymentModel({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });

    const savedPayment = await payment.save();

    res.json({
      message: "Order ID fetched successfully",
      data: { ...savedPayment.toJSON() },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to create order" });
  }
});

// Handle webhook
paymentRoute.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSignature = req.get("x-razorpay-signature");

    validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    const paymentDetails = req.body.payload.payment.entity;

    const payment = await paymentModel.findOne({
      orderId: paymentDetails.order_id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    payment.status = paymentDetails.status;
    await payment.save();

    const user = await User.findById(payment.userId);
    if (user) {
      user.isPremium = true;
      user.memberShipType = payment.notes.memberShipType;
      await user.save();
    }

    return res.status(200).json({ msg: "WebHook received successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ message: "Invalid webhook or error processing" });
  }
});

module.exports = paymentRoute;
