const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

/**
 * HELPER FUNCTION: Extract month from a date
 * Converts '2024-03-15' to '2024-03-01'
 */
// In your backend routes (spendingRoutes.js, billsRoutes.js, etc.)
const getMonthFromDate = (dateString) => {
  const date = new Date(dateString);

  // USE UTC METHODS to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  return `${year}-${month.toString().padStart(2, "0")}-01`;
};

/**
 * @route   GET /api/spending
 * @desc    Get all spending entries for logged in user
 * @access  Private
 *

 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { month } = req.query; // Optional month filter

    let query = `SELECT * FROM spending_entries WHERE user_id = $1`;
    let params = [userId];
    let paramIndex = 2;

    // If month is provided, filter by it
    if (month) {
      query += ` AND month = $${paramIndex}`;
      params.push(month);
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching spending:", error);
    res.status(500).json({ error: "Failed to fetch spending entries" });
  }
});

/**
 * @route   GET /api/spending/month/:year/:month
 * @desc    Get all spending for a specific month (NEW ROUTE)
 * @access  Private
 *
 * EXAMPLE: /api/spending/month/2024/3 - gets all March 2024 spending
 */
router.get("/month/:year/:month", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { year, month } = req.params;

    // Format as first day of month (e.g., 2024-03-01)
    const monthDate = `${year}-${month.padStart(2, "0")}-01`;

    const result = await db.query(
      `SELECT * FROM spending_entries 
       WHERE user_id = $1 AND month = $2 
       ORDER BY date DESC`,
      [userId, monthDate],
    );

    res.json({
      month: monthDate,
      spending: result.rows,
      total: result.rows.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0,
      ),
    });
  } catch (error) {
    console.error("Error fetching monthly spending:", error);
    res.status(500).json({ error: "Failed to fetch monthly spending" });
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
 * @route   POST /api/spending/reset
 * @desc    Reset spending for new month
 * @access  Private
 *
 * FIX: Now uses month column instead of EXTRACT
 */
router.post("/reset", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-01`;

    // Delete all spending entries for the current user in the current month
    const result = await db.query(
      `DELETE FROM spending_entries 
       WHERE user_id = $1 AND month = $2
       RETURNING *`,
      [userId, currentMonth],
    );

    console.log(`Reset ${result.rowCount} spending entries for new month`);

    res.json({
      message: "Spending reset for new month",
      month: currentMonth,
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error("Error resetting spending:", error);
    res.status(500).json({ error: "Failed to reset spending" });
  }
});

/**
 * @route   POST /api/spending
 * @desc    Create a new spending entry
 * @access  Private
 *
 * FIX: Now automatically sets month column from the date
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

    // Calculate month from the date (first day of that month)
    const month = getMonthFromDate(date);

    const result = await db.query(
      `INSERT INTO spending_entries 
       (user_id, amount, description, category, date, month) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, amount, description, category, date, month],
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
 *
 * FIX: Updates month column if date changes
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

    // Calculate new month if date is being updated
    let month = null;
    if (date) {
      month = getMonthFromDate(date);
    }

    // Update the entry (month will be updated if date changed)
    const result = await db.query(
      `UPDATE spending_entries 
       SET amount = COALESCE($1, amount),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           date = COALESCE($4, date),
           month = COALESCE($5, month)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [amount, description, category, date, month, id, userId],
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
 *
 * FIX: Now uses month column for better performance
 */
router.get("/analytics/summary", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { month } = req.query; // Optional: specific month

    // Get current month if not specified
    let targetMonth = month;
    if (!targetMonth) {
      const now = new Date();
      targetMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-01`;
    }

    // Total spent this month
    const totalSpent = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM spending_entries 
       WHERE user_id = $1 AND month = $2`,
      [userId, targetMonth],
    );

    // Spending by category
    const byCategory = await db.query(
      `SELECT category, 
              COALESCE(SUM(amount), 0) as total,
              COUNT(*) as count
       FROM spending_entries 
       WHERE user_id = $1 AND month = $2
       GROUP BY category
       ORDER BY total DESC`,
      [userId, targetMonth],
    );

    // Daily spending within the month
    const dailySpending = await db.query(
      `SELECT date, 
              COALESCE(SUM(amount), 0) as total,
              COUNT(*) as count
       FROM spending_entries 
       WHERE user_id = $1 AND month = $2
       GROUP BY date
       ORDER BY date ASC`,
      [userId, targetMonth],
    );

    res.json({
      month: targetMonth,
      total_spent: parseFloat(totalSpent.rows[0].total),
      by_category: byCategory.rows,
      daily: dailySpending.rows,
    });
  } catch (error) {
    console.error("Error fetching spending analytics:", error);
    res.status(500).json({ error: "Failed to fetch spending analytics" });
  }
});

/**
 * @route   GET /api/spending/analytics/categories
 * @desc    Get spending breakdown by categories over time
 * @access  Private
 *
 * FIX: Uses month column and supports date range
 */
router.get("/analytics/categories", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { months = 3 } = req.query; // Default last 3 months

    const result = await db.query(
      `SELECT 
          category,
          month,
          COALESCE(SUM(amount), 0) as total,
          COUNT(*) as transaction_count
       FROM spending_entries 
       WHERE user_id = $1 
         AND month >= CURRENT_DATE - INTERVAL '${months} months'
       GROUP BY category, month
       ORDER BY month DESC, total DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching category analytics:", error);
    res.status(500).json({ error: "Failed to fetch category analytics" });
  }
});

/**
 * @route   GET /api/spending/archived/:month
 * @desc    Get spending for a specific archived month (NEW ROUTE)
 * @access  Private
 *
 * EXAMPLE: /api/spending/archived/2024-02-01 - gets all February 2024 spending
 */
router.get("/archived/:month", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { month } = req.params;

    // Validate month format (YYYY-MM-DD)
    if (!month.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res
        .status(400)
        .json({ error: "Invalid month format. Use YYYY-MM-DD" });
    }

    const result = await db.query(
      `SELECT * FROM spending_entries 
       WHERE user_id = $1 AND month = $2 
       ORDER BY date DESC`,
      [userId, month],
    );

    res.json({
      month: month,
      spending: result.rows,
      total: result.rows.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0,
      ),
    });
  } catch (error) {
    console.error("Error fetching archived spending:", error);
    res.status(500).json({ error: "Failed to fetch archived spending" });
  }
});

module.exports = router;
