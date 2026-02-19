// 📌 PURPOSE: Handle authentication logic
// PUBLIC routes - anyone can access

const db = require("../database/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ============ REGISTER ============
// Creates new user account
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user - ⚠️ NOTE: Your table doesn't have password column!
    // You need to ALTER TABLE to add password column
    const result = await db.query(
      `INSERT INTO users (email, name, password) 
             VALUES ($1, $2, $3) 
             RETURNING id, email, name`,
      [email, name, hashedPassword],
    );

    // CREATE JWT TOKEN
    const token = jwt.sign(
      { userId: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // SEND token and user data
    res.status(201).json({
      token,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ============ LOGIN ============
// Authenticates existing user
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // CREATE JWT TOKEN
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // SEND token and user data (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ============ GET CURRENT USER ============
// Gets logged in user's info
// GET /api/auth/me
const getCurrentUser = async (req, res) => {
  try {
    // ✅ req.userId comes from AUTH MIDDLEWARE
    const userId = req.userId;

    const result = await db.query(
      "SELECT id, email, name, image_url, created_at FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ============ GOOGLE AUTH ============
// Handles Google OAuth login
// POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, imageUrl } = req.body;

    // Check if user exists
    let result = await db.query(
      "SELECT * FROM users WHERE email = $1 OR google_id = $2",
      [email, googleId],
    );

    let user;

    if (result.rows.length === 0) {
      // Create new user
      const insertResult = await db.query(
        `INSERT INTO users (email, name, google_id, image_url) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id, email, name, image_url`,
        [email, name, googleId, imageUrl],
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
      // Update google_id if not set
      if (!user.google_id) {
        await db.query(
          "UPDATE users SET google_id = $1, image_url = $2 WHERE id = $3",
          [googleId, imageUrl, user.id],
        );
      }
    }

    // CREATE TOKEN
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  googleAuth,
};
