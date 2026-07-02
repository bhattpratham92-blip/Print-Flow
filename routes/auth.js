const express = require("express");
const jwt = require("jsonwebtoken");

const { auth, db, admin } = require("../config/firebase");
const { authLimiter } = require("../middleware/security");

const router = express.Router();

/*
  Register User
*/
router.post("/register", authLimiter, async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message:
          "email, password and name are required"
      });
    }

    const user = await auth.createUser({
      email,
      password,
      displayName: name
    });

    const userData = {
      uid: user.uid,
      email,
      name,
      role: role || "shop",
      createdAt:
        admin.firestore.FieldValue.serverTimestamp()
    };

    await db
      .collection("users")
      .doc(user.uid)
      .set(userData);

    return res.status(201).json({
      success: true,
      user: userData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  Login
*/
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const user = snapshot.docs[0].data();

    const token = jwt.sign(
      {
        uid: user.uid,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN || "7d"
      }
    );

    return res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  Profile
*/
router.get("/me", async (req, res) => {
  return res.json({
    success: true,
    message:
      "Use protected route middleware to fetch profile"
  });
});
router.post("/agent-login", async (req, res) => {
  try {
    const { shopId, agentSecret } = req.body;

    if (
      shopId !== process.env.SHOP_ID ||
      agentSecret !== process.env.AGENT_SECRET
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid agent credentials"
      });
    }

    const snapshot = await db
      .collection("users")
      .where("role", "==", "shop")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Shop user not found"
      });
    }

    const user = snapshot.docs[0].data();

    const token = jwt.sign(
      {
        uid: user.uid,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.json({
      success: true,
      token
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});router.post("/agent-login", async (req, res) => {
  try {
    const { shopId, agentSecret } = req.body;

    if (
      shopId !== process.env.SHOP_ID ||
      agentSecret !== process.env.AGENT_SECRET
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid agent credentials"
      });
    }

    const snapshot = await db
      .collection("users")
      .where("role", "==", "shop")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Shop user not found"
      });
    }

    const user = snapshot.docs[0].data();

    const token = jwt.sign(
      {
        uid: user.uid,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.json({
      success: true,
      token
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
module.exports = router;