const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

/**
 * @route   GET /api/spending
 * @desc    Get all spending entries for logged in user
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM spending_entries 
             WHERE user_id = $1 
             ORDER BY date DESC, created_at DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching spending:", error);
    res.status(500).json({ error: "Failed to fetch spending entries" });
  }
});

/**
 * @route   GET /api/spending/:id
 * @desc    Get single spending entry by ID
 * @access  Private
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM spending_entries 
             WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Spending entry not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching spending entry:", error);
    res.status(500).json({ error: "Failed to fetch spending entry" });
  }
});

/**
 * @route   POST /api/spending
 * @desc    Create a new spending entry
 * @access  Private
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, description, category, date } = req.body;

    // Validation
    if (!amount || !description || !category || !date) {
      return res.status(400).json({
        error:
          "Missing required fields. Need: amount, description, category, date",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const result = await db.query(
      `INSERT INTO spending_entries 
             (user_id, amount, description, category, date) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
      [userId, amount, description, category, date],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating spending entry:", error);
    res.status(500).json({ error: "Failed to create spending entry" });
  }
});

/**
 * @route   PUT /api/spending/:id
 * @desc    Update a spending entry
 * @access  Private
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount, description, category, date } = req.body;

    // First check if entry exists and belongs to user
    const checkResult = await db.query(
      "SELECT * FROM spending_entries WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Spending entry not found" });
    }

    // Update the entry
    const result = await db.query(
      `UPDATE spending_entries 
             SET amount = COALESCE($1, amount),
                 description = COALESCE($2, description),
                 category = COALESCE($3, category),
                 date = COALESCE($4, date)
             WHERE id = $5 AND user_id = $6
             RETURNING *`,
      [amount, description, category, date, id, userId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating spending entry:", error);
    res.status(500).json({ error: "Failed to update spending entry" });
  }
});

/**
 * @route   DELETE /api/spending/:id
 * @desc    Delete a spending entry
 * @access  Private
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      "DELETE FROM spending_entries WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Spending entry not found" });
    }

    res.json({
      message: "Spending entry deleted successfully",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error deleting spending entry:", error);
    res.status(500).json({ error: "Failed to delete spending entry" });
  }
});

/**
 * @route   GET /api/spending/analytics/summary
 * @desc    Get spending summary for current month
 * @access  Private
 */
router.get("/analytics/summary", auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // Total spent this month
    const totalSpent = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
             FROM spending_entries 
             WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
      [userId, monthStart, monthEnd],
    );

    // Spending by category
    const byCategory = await db.query(
      `SELECT category, 
                    COALESCE(SUM(amount), 0) as total,
                    COUNT(*) as count
             FROM spending_entries 
             WHERE user_id = $1 AND date BETWEEN $2 AND $3
             GROUP BY category
             ORDER BY total DESC`,
      [userId, monthStart, monthEnd],
    );

    // Daily spending
    const dailySpending = await db.query(
      `SELECT date, 
                    COALESCE(SUM(amount), 0) as total,
                    COUNT(*) as count
             FROM spending_entries 
             WHERE user_id = $1 AND date BETWEEN $2 AND $3
             GROUP BY date
             ORDER BY date ASC`,
      [userId, monthStart, monthEnd],
    );

    res.json({
      total_spent: parseFloat(totalSpent.rows[0].total),
      by_category: byCategory.rows,
      daily: dailySpending.rows,
      month: monthStart.substring(0, 7), // YYYY-MM
    });
  } catch (error) {
    console.error("Error fetching spending analytics:", error);
    res.status(500).json({ error: "Failed to fetch spending analytics" });
  }
});

/**
 * @route   GET /api/spending/analytics/categories
 * @desc    Get spending breakdown by categories
 * @access  Private
 */
router.get("/analytics/categories", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { months = 3 } = req.query; // Default last 3 months

    const result = await db.query(
      `SELECT 
                category,
                DATE_TRUNC('month', date) as month,
                COALESCE(SUM(amount), 0) as total,
                COUNT(*) as transaction_count
             FROM spending_entries 
             WHERE user_id = $1 
                AND date >= CURRENT_DATE - INTERVAL '${months} months'
             GROUP BY category, DATE_TRUNC('month', date)
             ORDER BY month DESC, total DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching category analytics:", error);
    res.status(500).json({ error: "Failed to fetch category analytics" });
  }
});

module.exports = router;
