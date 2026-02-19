const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

/**
 * @route   GET /api/bills
 * @desc    Get all bills and loans for logged in user
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM bills_loans 
             WHERE user_id = $1 
             ORDER BY 
                CASE WHEN status = 'unpaid' THEN 0 ELSE 1 END,
                due_date ASC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bills/loans:", error);
    res.status(500).json({ error: "Failed to fetch bills and loans" });
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
 * @desc    Get bills OR loans filtered by type
 * @access  Private
 */
router.get("/type/:type", auth, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.userId;

    // Validate type
    if (type !== "bill" && type !== "loan") {
      return res
        .status(400)
        .json({ error: 'Type must be either "bill" or "loan"' });
    }

    const result = await db.query(
      `SELECT * FROM bills_loans 
             WHERE user_id = $1 AND type = $2 
             ORDER BY 
                CASE WHEN status = 'unpaid' THEN 0 ELSE 1 END,
                due_date ASC`,
      [userId, type],
    );

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
    } = req.body;

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

    const result = await db.query(
      `INSERT INTO bills_loans 
             (user_id, type, name, amount, category, due_date, recurrence, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING *`,
      [
        userId,
        type,
        name,
        amount,
        category || null,
        due_date,
        recurrence,
        status,
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

    // Update
    const result = await db.query(
      `UPDATE bills_loans 
             SET type = COALESCE($1, type),
                 name = COALESCE($2, name),
                 amount = COALESCE($3, amount),
                 category = COALESCE($4, category),
                 due_date = COALESCE($5, due_date),
                 recurrence = COALESCE($6, recurrence),
                 status = COALESCE($7, status)
             WHERE id = $8 AND user_id = $9
             RETURNING *`,
      [type, name, amount, category, due_date, recurrence, status, id, userId],
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
 * @desc    Get summary of all bills and loans
 * @access  Private
 */
router.get("/analytics/summary", auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Total bills
    const totalBills = await db.query(
      `SELECT 
                COALESCE(SUM(CASE WHEN type = 'bill' THEN amount ELSE 0 END), 0) as total_bills,
                COALESCE(SUM(CASE WHEN type = 'loan' THEN amount ELSE 0 END), 0) as total_loans,
                COUNT(CASE WHEN type = 'bill' THEN 1 END) as bills_count,
                COUNT(CASE WHEN type = 'loan' THEN 1 END) as loans_count
             FROM bills_loans 
             WHERE user_id = $1`,
      [userId],
    );

    // Unpaid counts
    const unpaid = await db.query(
      `SELECT 
                COUNT(CASE WHEN type = 'bill' AND status = 'unpaid' THEN 1 END) as unpaid_bills,
                COUNT(CASE WHEN type = 'loan' AND status = 'unpaid' THEN 1 END) as unpaid_loans,
                COALESCE(SUM(CASE WHEN type = 'bill' AND status = 'unpaid' THEN amount ELSE 0 END), 0) as unpaid_bills_amount,
                COALESCE(SUM(CASE WHEN type = 'loan' AND status = 'unpaid' THEN amount ELSE 0 END), 0) as unpaid_loans_amount
             FROM bills_loans 
             WHERE user_id = $1`,
      [userId],
    );

    res.json({
      totals: {
        bills: parseFloat(totalBills.rows[0].total_bills),
        loans: parseFloat(totalBills.rows[0].total_loans),
        bills_count: parseInt(totalBills.rows[0].bills_count),
        loans_count: parseInt(totalBills.rows[0].loans_count),
      },
      unpaid: {
        bills: parseInt(unpaid.rows[0].unpaid_bills),
        loans: parseInt(unpaid.rows[0].unpaid_loans),
        bills_amount: parseFloat(unpaid.rows[0].unpaid_bills_amount),
        loans_amount: parseFloat(unpaid.rows[0].unpaid_loans_amount),
      },
    });
  } catch (error) {
    console.error("Error fetching bills summary:", error);
    res.status(500).json({ error: "Failed to fetch bills summary" });
  }
});

module.exports = router;
