require("dotenv").config();

const express = require("express");
const cors = require("cors");

const logger = require("./config/logger");

const {
  securityHeaders,
  apiLimiter
} = require("./middleware/security");

const authRoutes = require("./routes/auth");
const shopRoutes = require("./routes/shops");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");

const {
  startCleanupJob
} = require("./jobs/cleanupJob");

const {
  startSubscriptionJob
} = require("./jobs/subscriptionJob");

require("./config/firebase");

const app = express();

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Core Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(securityHeaders);

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);

app.use((req, res, next) => {

  // Electron Agent polling
  if (req.path.startsWith("/api/orders/shop/")) {
    return next();
  }

  // Electron download
  if (req.path.startsWith("/api/orders/files/")) {
    return next();
  }

  // Electron status updates
  if (
    req.path.includes("/status") ||
    req.path.includes("/printed")
  ) {
    return next();
  }

  apiLimiter(req, res, next);

});

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "PrintFlow",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

/*
|--------------------------------------------------------------------------
| Static Frontend
|--------------------------------------------------------------------------
*/

app.use(express.static("public"));
app.use(
  "/previews",
  express.static("uploads/previews")
);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use("/api/shops", shopRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/admin", adminRoutes);

/* TEST ROUTE */
const { db } = require("./config/firebase");

app.get("/test-orders", async (req, res) => {
  const snapshot = await db.collection("orders").get();

  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  res.json(data);
});

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);

  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message
  });
});

/*
|--------------------------------------------------------------------------
| Startup
|--------------------------------------------------------------------------
*/

const startServer = async () => {
  try {
    startCleanupJob();
    startSubscriptionJob();

    app.listen(PORT, () => {
      logger.info(
        `PrintFlow server running on port ${PORT}`
      );

      logger.info(
        `Environment: ${process.env.NODE_ENV || "development"}`
      );

      logger.info(
        "Cleanup scheduler started"
      );

      logger.info(
        "Subscription scheduler started"
      );
    });
  } catch (error) {
    logger.error(
      `Startup failed: ${error.message}`
    );

    process.exit(1);
  }
};

startServer();

/*
|--------------------------------------------------------------------------
| Process Handlers
|--------------------------------------------------------------------------
*/

process.on("unhandledRejection", error => {
  logger.error(
    `Unhandled Rejection: ${error.message}`
  );
});

process.on("uncaughtException", error => {
  logger.error(
    `Uncaught Exception: ${error.message}`
  );

  process.exit(1);
});

module.exports = app;