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

    // Save order detail to frontend
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

    // Return back my order details to frontend
    res.json({
      message: "Order ID fetched successfully",
      data: { ...savedPayment.toJSON() },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err.message);
  }
});

paymentRoute.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-Signature"];
    validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!validateWebhookSignature) return new Error("Webhook not valid");

    // Update my payment status in DB
    const paymentDetails = req.body.payload.payment.entity;

    const payment = await paymentModel.findOne({
      orderId: paymentDetails.order_id,
    });

    payment.status = paymentDetails.status;

    await payment.save();

    // Update the user as premium
    const user = await User({ _id: payment.userId });
    user.isPremium = true;
    user.memberShipType = payment.notes.memberShipType;
    await user.save();

    if (req.body.event === "payment.capture") {
    }

    if (req.body.event === "payment.failed") {
    }

    // return success response to razorpay
    return res.status(200).json({ msg: "WebHook received successfully" });
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = paymentRoute;
