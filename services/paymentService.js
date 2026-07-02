const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class PaymentService {
  async createOrder(amount, receipt) {
    return razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt
    });
  }

  verifyPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  }) {
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    return generatedSignature === razorpay_signature;
  }

  verifyWebhook(body, signature) {
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
      .update(JSON.stringify(body))
      .digest("hex");

    return generatedSignature === signature;
  }
}

module.exports = new PaymentService();