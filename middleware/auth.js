const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| 1. Normal Users -> JWT Token
| 2. Electron Agent -> AGENT_SECRET
|
*/

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const token = authHeader.split(" ")[1];

    /*
    |--------------------------------------------------------------------------
    | Electron Agent Authentication
    |--------------------------------------------------------------------------
    */

    if (token === process.env.AGENT_SECRET) {
      req.user = {
        uid: "print-agent",
        role: "shop",
        name: "PrintFlow Agent",
        isAgent: true
      };

      return next();
    }

    /*
    |--------------------------------------------------------------------------
    | JWT Authentication
    |--------------------------------------------------------------------------
    */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userDoc = await db
      .collection("users")
      .doc(decoded.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    req.user = {
      uid: decoded.uid,
      ...userDoc.data(),
      isAgent: false
    };

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

/*
|--------------------------------------------------------------------------
| Authorization
|--------------------------------------------------------------------------
*/

const authorize = (...roles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};