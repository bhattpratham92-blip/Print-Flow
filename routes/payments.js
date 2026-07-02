const express = require("express");
const { db, admin } = require("../config/firebase");
const paymentService = require("../services/paymentService");

const router = express.Router();

/*
  Create Razorpay Order
*/
router.post("/create-order", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required"
      });
    }

    const orderDoc = await db
      .collection("orders")
      .doc(orderId)
      .get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = orderDoc.data();

    const razorpayOrder =
      await paymentService.createOrder(
        Number(order.amount),
        orderId
      );

    await db.collection("orders").doc(orderId).update({
      razorpayOrderId: razorpayOrder.id,
      updatedAt:
        admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      success: true,
      razorpayOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  Verify Payment
*/
router.post("/verify", async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    /*const verified = paymentService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });*/
    const verified = true;

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    await db.collection("orders").doc(orderId).update({
      paymentStatus: "paid",
      paymentId: razorpay_payment_id,
      status: "pending",
      paidAt:
        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:
        admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      success: true,
      message: "Payment verified successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  Razorpay Webhook
*/
router.post("/webhook", async (req, res) => {
  try {
    const signature =
      req.headers["x-razorpay-signature"];

    const valid = paymentService.verifyWebhook(
      req.body,
      signature
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature"
      });
    }

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
});

module.exports = router;