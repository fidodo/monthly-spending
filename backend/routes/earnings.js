const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

/**
 * @route   GET /api/earnings/current
 * @desc    Get current month's earning
 * @access  Private
 */
router.get("/current", auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Get first day of current month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const result = await db.query(
      `SELECT * FROM monthly_earnings 
             WHERE user_id = $1 
                AND DATE_TRUNC('month', month) = DATE_TRUNC('month', $2::date)
             LIMIT 1`,
      [userId, monthStart],
    );

    if (result.rows.length === 0) {
      return res.json({
        amount: 0,
        month: monthStart.toISOString().split("T")[0],
      });
    }

    res.json({
      id: result.rows[0].id,
      amount: parseFloat(result.rows[0].amount),
      month: result.rows[0].month,
    });
  } catch (error) {
    console.error("Error fetching current earnings:", error);
    res.status(500).json({ error: "Failed to fetch current earnings" });
  }
});

/**
 * @route   GET /api/earnings/history
 * @desc    Get earnings history for all months
 * @access  Private
 */
router.get("/history", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM monthly_earnings 
             WHERE user_id = $1 
             ORDER BY month DESC`,
      [userId],
    );

    res.json(
      result.rows.map((row) => ({
        ...row,
        amount: parseFloat(row.amount),
      })),
    );
  } catch (error) {
    console.error("Error fetching earnings history:", error);
    res.status(500).json({ error: "Failed to fetch earnings history" });
  }
});

/**
 * @route   POST /api/earnings
 * @desc    Set monthly earning (creates new or updates existing)
 * @access  Private
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, month } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // If month not provided, use current month
    const earningMonth = month || new Date().toISOString().split("T")[0];

    // Check if entry exists for this month
    const existing = await db.query(
      `SELECT id FROM monthly_earnings 
             WHERE user_id = $1 
                AND DATE_TRUNC('month', month) = DATE_TRUNC('month', $2::date)`,
      [userId, earningMonth],
    );

    let result;

    if (existing.rows.length > 0) {
      // Update existing
      result = await db.query(
        `UPDATE monthly_earnings 
                 SET amount = $1 
                 WHERE id = $2 
                 RETURNING *`,
        [amount, existing.rows[0].id],
      );
    } else {
      // Insert new
      result = await db.query(
        `INSERT INTO monthly_earnings (user_id, amount, month) 
                 VALUES ($1, $2, $3) 
                 RETURNING *`,
        [userId, amount, earningMonth],
      );
    }

    res.json({
      id: result.rows[0].id,
      amount: parseFloat(result.rows[0].amount),
      month: result.rows[0].month,
    });
  } catch (error) {
    console.error("Error setting monthly earning:", error);
    res.status(500).json({ error: "Failed to set monthly earning" });
  }
});

/**
 * @route   PUT /api/earnings/:id
 * @desc    Update a specific earning entry
 * @access  Private
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const result = await db.query(
      `UPDATE monthly_earnings 
             SET amount = $1 
             WHERE id = $2 AND user_id = $3 
             RETURNING *`,
      [amount, id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Earning entry not found" });
    }

    res.json({
      id: result.rows[0].id,
      amount: parseFloat(result.rows[0].amount),
      month: result.rows[0].month,
    });
  } catch (error) {
    console.error("Error updating earning:", error);
    res.status(500).json({ error: "Failed to update earning" });
  }
});

/**
 * @route   DELETE /api/earnings/:id
 * @desc    Delete a specific earning entry
 * @access  Private
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      "DELETE FROM monthly_earnings WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Earning entry not found" });
    }

    res.json({ message: "Earning entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting earning:", error);
    res.status(500).json({ error: "Failed to delete earning" });
  }
});

/**
 * @route   GET /api/earnings/analytics/comparison
 * @desc    Compare spending vs earnings for current month
 * @access  Private
 */
router.get("/analytics/comparison", auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Get current month's earning
    const earning = await db.query(
      `SELECT amount FROM monthly_earnings 
             WHERE user_id = $1 
                AND DATE_TRUNC('month', month) = DATE_TRUNC('month', CURRENT_DATE)
             LIMIT 1`,
      [userId],
    );

    // Get current month's spending
    const spending = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
             FROM spending_entries 
             WHERE user_id = $1 
                AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)`,
      [userId],
    );

    const monthlyEarning =
      earning.rows.length > 0 ? parseFloat(earning.rows[0].amount) : 0;
    const totalSpent = parseFloat(spending.rows[0].total);
    const remaining = monthlyEarning - totalSpent;
    const percentage =
      monthlyEarning > 0 ? (totalSpent / monthlyEarning) * 100 : 0;

    res.json({
      monthly_earning: monthlyEarning,
      total_spent: totalSpent,
      remaining: remaining,
      percentage_spent: percentage,
      is_over_budget: remaining < 0,
      is_warning: percentage >= 80 && percentage < 100,
      month: new Date().toISOString().split("T")[0].substring(0, 7),
    });
  } catch (error) {
    console.error("Error fetching comparison:", error);
    res.status(500).json({ error: "Failed to fetch earnings comparison" });
  }
});

module.exports = router;
