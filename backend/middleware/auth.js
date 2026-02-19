// 📌 PURPOSE: Protect routes by verifying JWT token
// PRIVATE routes guard - called BEFORE controllers

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        error: "No token provided. Authorization denied.",
      });
    }

    // 2. Extract token (remove 'Bearer ' prefix)
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: "Invalid token format. Authorization denied.",
      });
    }

    // 3. VERIFY token (this is the KEY difference from controller)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. ADD userId to request object
    req.userId = decoded.userId;

    // 5. PASS to next middleware/controller
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    res.status(500).json({ error: "Server error" });
  }
};

module.exports = authMiddleware;
