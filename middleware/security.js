const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts."
  }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Upload limit exceeded."
  }
});

const securityHeaders = helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  securityHeaders
};