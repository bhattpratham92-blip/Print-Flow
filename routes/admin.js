const express = require("express");
const { db } = require("../config/firebase");
const {
  authenticate,
  authorize
} = require("../middleware/auth");

const router = express.Router();

/*
  All routes below require admin access
*/
router.use(authenticate);
router.use(authorize("admin"));

/*
  Platform Stats
*/
router.get("/stats", async (req, res) => {
  try {
    const [
      shopsSnapshot,
      ordersSnapshot,
      usersSnapshot
    ] = await Promise.all([
      db.collection("shops").get(),
      db.collection("orders").get(),
      db.collection("users").get()
    ]);

    let revenue = 0;

    ordersSnapshot.forEach(doc => {
      const order = doc.data();

      if (order.paymentStatus === "paid") {
        revenue += Number(order.amount || 0);
      }
    });

    return res.json({
      success: true,
      stats: {
        shops: shopsSnapshot.size,
        users: usersSnapshot.size,
        orders: ordersSnapshot.size,
        revenue
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  List Shops
*/
router.get("/shops", async (req, res) => {
  try {
    const snapshot = await db
      .collection("shops")
      .get();

    const shops = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json({
      success: true,
      shops
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  Suspend Shop
*/
router.patch(
  "/shops/:shopId/suspend",
  async (req, res) => {
    try {
      await db
        .collection("shops")
        .doc(req.params.shopId)
        .update({
          status: "suspended"
        });

      return res.json({
        success: true,
        message: "Shop suspended"
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/*
  Activate Shop
*/
router.patch(
  "/shops/:shopId/activate",
  async (req, res) => {
    try {
      await db
        .collection("shops")
        .doc(req.params.shopId)
        .update({
          status: "active"
        });

      return res.json({
        success: true,
        message: "Shop activated"
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;