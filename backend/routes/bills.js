const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

/**
 * HELPER FUNCTION: Get first day of month from date string
 */
const getMonthFromDate = (dateString) => {
  if (!dateString) {
    console.error("❌ getMonthFromDate received null/undefined date");
    return null;
  }

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error("❌ Invalid date string:", dateString);
      return null;
    }

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");

    const result = `${year}-${month}-01`;
    console.log("✅ getMonthFromDate success:", dateString, "→", result);
    return result;
  } catch (e) {
    console.error("❌ Error in getMonthFromDate:", e);
    return null;
  }
};

/**
 * @route   GET /api/bills
 * @desc    Get all bills and loans (optionally filtered by month)
 * @access  Private
 * Example: /api/bills?month=2024-03-01
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { month } = req.query;

    let query = `SELECT * FROM bills_loans WHERE user_id = $1`;
    let params = [userId];
    let paramIndex = 2;

    // If month is provided, filter by it
    if (month) {
      query += ` AND month = $${paramIndex}`;
      params.push(month);
    }

    query += ` ORDER BY 
                CASE WHEN status = 'unpaid' THEN 0 ELSE 1 END,
                due_date ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bills/loans:", error);
    res.status(500).json({ error: "Failed to fetch bills and loans" });
  }
});

/**
 * @route   GET /api/bills/month/:year/:month
 * @desc    Get bills for a specific month (NEW ROUTE)
 * @access  Private
 */
router.get("/month/:year/:month", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { year, month } = req.params;
    const monthDate = `${year}-${month.padStart(2, "0")}-01`;

    const result = await db.query(
      `SELECT * FROM bills_loans 
       WHERE user_id = $1 AND month = $2
       ORDER BY due_date ASC`,
      [userId, monthDate],
    );

    res.json({
      month: monthDate,
      bills: result.rows,
      total: result.rows.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0,
      ),
    });
  } catch (error) {
    console.error("Error fetching monthly bills:", error);
    res.status(500).json({ error: "Failed to fetch monthly bills" });
  }
});

/**
 * @route   GET /api/bills/:id
 * @desc    Get single bill/loan by ID
 * @access  Private
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      "SELECT * FROM bills_loans WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bill/Loan not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching bill/loan:", error);
    res.status(500).json({ error: "Failed to fetch bill/loan" });
  }
});

/**
 * @route   GET /api/bills/type/:type
 * @desc    Get bills OR loans filtered by type and optional month
 * @access  Private
 */
router.get("/type/:type", auth, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.userId;
    const { month } = req.query;

    // Validate type
    if (type !== "bill" && type !== "loan") {
      return res
        .status(400)
        .json({ error: 'Type must be either "bill" or "loan"' });
    }

    let query = `SELECT * FROM bills_loans WHERE user_id = $1 AND type = $2`;
    let params = [userId, type];
    let paramIndex = 3;

    if (month) {
      query += ` AND month = $${paramIndex}`;
      params.push(month);
    }

    query += ` ORDER BY 
                CASE WHEN status = 'unpaid' THEN 0 ELSE 1 END,
                due_date ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching by type:", error);
    res.status(500).json({ error: "Failed to fetch bills/loans by type" });
  }
});

/**
 * @route   POST /api/bills
 * @desc    Create a new bill or loan
 * @access  Private
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Creating bill/loan with data:", req.body);
    const {
      type,
      name,
      amount,
      category,
      due_date,
      recurrence = "monthly",
      status = "unpaid",
      total_loan_amount,
      interest_rate,
      term_months,
      remaining_balance,
    } = req.body;
    console.log("Received due_date:", due_date);
    // Validation
    if (!type || !name || !amount || !due_date) {
      return res.status(400).json({
        error: "Missing required fields. Need: type, name, amount, dueDate",
      });
    }

    if (type !== "bill" && type !== "loan") {
      return res.status(400).json({ error: 'Type must be "bill" or "loan"' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // Calculate month from due_date
    const month = getMonthFromDate(due_date);
    console.log("Calculated month from due_date:", month);

    console.log("🔍 due_date value:", due_date);
    console.log("🔍 due_date type:", typeof due_date);
    console.log("🔍 calculated month:", month);
    console.log("🔍 month type:", typeof month);

    // DEBUG: Check if month is valid
    if (!month) {
      console.error("❌ month is null/undefined! due_date was:", due_date);
      return res.status(400).json({
        error: "Invalid due_date format. Could not calculate month.",
        received_due_date: due_date,
      });
    }

    const result = await db.query(
      `INSERT INTO bills_loans 
       (user_id, type, name, amount, category, due_date, month, recurrence, status,
        total_loan_amount, interest_rate, term_months, remaining_balance) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        userId,
        type,
        name,
        amount,
        category || null,
        due_date,
        month,
        recurrence,
        status,
        total_loan_amount || null,
        interest_rate || null,
        term_months || null,
        remaining_balance || null,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating bill/loan:", error);
    res.status(500).json({ error: "Failed to create bill/loan" });
  }
});

/**
 * @route   PUT /api/bills/:id
 * @desc    Update a bill or loan
 * @access  Private
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { type, name, amount, category, due_date, recurrence, status } =
      req.body;

    // Check if exists
    const checkResult = await db.query(
      "SELECT * FROM bills_loans WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Bill/Loan not found" });
    }

    // Calculate new month if due_date is being updated
    let month = null;
    if (due_date) {
      month = getMonthFromDate(due_date);
    }

    // Update
    const result = await db.query(
      `UPDATE bills_loans 
       SET type = COALESCE($1, type),
           name = COALESCE($2, name),
           amount = COALESCE($3, amount),
           category = COALESCE($4, category),
           due_date = COALESCE($5, due_date),
           month = COALESCE($6, month),
           recurrence = COALESCE($7, recurrence),
           status = COALESCE($8, status)
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        type,
        name,
        amount,
        category,
        due_date,
        month,
        recurrence,
        status,
        id,
        userId,
      ],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating bill/loan:", error);
    res.status(500).json({ error: "Failed to update bill/loan" });
  }
});

/**
 * @route   PUT /api/bills/:id/paid
 * @desc    Mark a bill/loan as paid
 * @access  Private
 */
router.put("/:id/paid", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      `UPDATE bills_loans 
       SET status = 'paid', 
           last_paid = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bill/Loan not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error marking as paid:", error);
    res.status(500).json({ error: "Failed to mark as paid" });
  }
});

/**
 * @route   PUT /api/bills/:id/unpaid
 * @desc    Mark a bill/loan as unpaid
 * @access  Private
 */
router.put("/:id/unpaid", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      `UPDATE bills_loans 
       SET status = 'unpaid',
           last_paid = NULL
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bill/Loan not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error marking as unpaid:", error);
    res.status(500).json({ error: "Failed to mark as unpaid" });
  }
});

/**
 * @route   DELETE /api/bills/:id
 * @desc    Delete a bill or loan
 * @access  Private
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      "DELETE FROM bills_loans WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bill/Loan not found" });
    }

    res.json({
      message: "Bill/Loan deleted successfully",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error deleting bill/loan:", error);
    res.status(500).json({ error: "Failed to delete bill/loan" });
  }
});

/**
 * @route   GET /api/bills/analytics/upcoming
 * @desc    Get upcoming unpaid bills/loans for next 7 days
 * @access  Private
 */
router.get("/analytics/upcoming", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM bills_loans 
       WHERE user_id = $1 
          AND status = 'unpaid'
          AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       ORDER BY due_date ASC`,
      [userId],
    );

    res.json({
      count: result.rows.length,
      items: result.rows,
      total_amount: result.rows.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0,
      ),
    });
  } catch (error) {
    console.error("Error fetching upcoming payments:", error);
    res.status(500).json({ error: "Failed to fetch upcoming payments" });
  }
});

/**
 * @route   GET /api/bills/analytics/overdue
 * @desc    Get overdue unpaid bills/loans
 * @access  Private
 */
router.get("/analytics/overdue", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM bills_loans 
       WHERE user_id = $1 
          AND status = 'unpaid'
          AND due_date < CURRENT_DATE
       ORDER BY due_date ASC`,
      [userId],
    );

    res.json({
      count: result.rows.length,
      items: result.rows,
      total_amount: result.rows.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0,
      ),
    });
  } catch (error) {
    console.error("Error fetching overdue payments:", error);
    res.status(500).json({ error: "Failed to fetch overdue payments" });
  }
});

/**
 * @route   GET /api/bills/analytics/summary
 * @desc    Get summary of all bills and loans (optionally by month)
 * @access  Private
 */
router.get("/analytics/summary", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { month } = req.query;

    let query = `SELECT * FROM bills_loans WHERE user_id = $1`;
    let params = [userId];

    if (month) {
      query += ` AND month = $2`;
      params.push(month);
    }

    const result = await db.query(query, params);
    const rows = result.rows;

    // Calculate totals
    const totalBills = rows
      .filter((item) => item.type === "bill")
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);

    const totalLoans = rows
      .filter((item) => item.type === "loan")
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);

    const unpaidBills = rows
      .filter((item) => item.type === "bill" && item.status === "unpaid")
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);

    const unpaidLoans = rows
      .filter((item) => item.type === "loan" && item.status === "unpaid")
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);

    res.json({
      month: month || "all",
      totals: {
        bills: totalBills,
        loans: totalLoans,
        bills_count: rows.filter((item) => item.type === "bill").length,
        loans_count: rows.filter((item) => item.type === "loan").length,
      },
      unpaid: {
        bills: rows.filter(
          (item) => item.type === "bill" && item.status === "unpaid",
        ).length,
        loans: rows.filter(
          (item) => item.type === "loan" && item.status === "unpaid",
        ).length,
        bills_amount: unpaidBills,
        loans_amount: unpaidLoans,
      },
    });
  } catch (error) {
    console.error("Error fetching bills summary:", error);
    res.status(500).json({ error: "Failed to fetch bills summary" });
  }
});

/**
 * @route   DELETE /api/bills/reset (REMOVED - no longer needed)
 * We don't reset anymore, we just filter by month!
 */

module.exports = router;
