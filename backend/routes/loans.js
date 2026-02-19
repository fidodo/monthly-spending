const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

// ============================================
// LOAN ROUTES - SPECIFIC TO LOANS ONLY
// ============================================

/**
 * @route   GET /api/loans
 * @desc    Get all loans for logged in user
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM bills_loans 
             WHERE user_id = $1 AND type = 'loan'
             ORDER BY 
                CASE WHEN status = 'unpaid' THEN 0 ELSE 1 END,
                due_date ASC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

/**
 * @route   GET /api/loans/active
 * @desc    Get all active (unpaid) loans
 * @access  Private
 */
router.get("/active", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM bills_loans 
             WHERE user_id = $1 AND type = 'loan' AND status = 'unpaid'
             ORDER BY due_date ASC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching active loans:", error);
    res.status(500).json({ error: "Failed to fetch active loans" });
  }
});

/**
 * @route   GET /api/loans/paid
 * @desc    Get all paid loans
 * @access  Private
 */
router.get("/paid", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM bills_loans 
             WHERE user_id = $1 AND type = 'loan' AND status = 'paid'
             ORDER BY last_paid DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching paid loans:", error);
    res.status(500).json({ error: "Failed to fetch paid loans" });
  }
});

/**
 * @route   GET /api/loans/:id
 * @desc    Get a single loan by ID
 * @access  Private
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM bills_loans 
             WHERE id = $1 AND user_id = $2 AND type = 'loan'`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching loan:", error);
    res.status(500).json({ error: "Failed to fetch loan" });
  }
});

/**
 * @route   POST /api/loans
 * @desc    Create a new loan
 * @access  Private
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      amount,
      category,
      due_date,
      recurrence = "monthly",
      totalLoanAmount,
      interestRate,
      termMonths,
      remainingBalance,
      provider,
      accountNumber,
    } = req.body;

    // Validation
    if (!name || !amount || !due_date) {
      return res.status(400).json({
        error: "Missing required fields. Need: name, amount, dueDate",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const result = await db.query(
      `INSERT INTO bills_loans 
             (user_id, type, name, amount, category, due_date, recurrence, status,
              total_loan_amount, interest_rate, term_months, remaining_balance,
              provider, account_number) 
             VALUES ($1, 'loan', $2, $3, $4, $5, $6, 'unpaid', $7, $8, $9, $10, $11, $12) 
             RETURNING *`,
      [
        userId,
        name,
        amount,
        category || null,
        due_date,
        recurrence,
        totalLoanAmount || amount,
        interestRate || null,
        termMonths || null,
        remainingBalance || amount,
        provider || null,
        accountNumber || null,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating loan:", error);
    res.status(500).json({ error: "Failed to create loan" });
  }
});

/**
 * @route   PUT /api/loans/:id
 * @desc    Update a loan
 * @access  Private
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      name,
      amount,
      category,
      due_date,
      recurrence,
      status,
      totalLoanAmount,
      interestRate,
      termMonths,
      remainingBalance,
      provider,
      accountNumber,
    } = req.body;

    // Check if exists
    const checkResult = await db.query(
      "SELECT * FROM bills_loans WHERE id = $1 AND user_id = $2 AND type = $3",
      [id, userId, "loan"],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    // Update
    const result = await db.query(
      `UPDATE bills_loans 
             SET name = COALESCE($1, name),
                 amount = COALESCE($2, amount),
                 category = COALESCE($3, category),
                 due_date = COALESCE($4, due_date),
                 recurrence = COALESCE($5, recurrence),
                 status = COALESCE($6, status),
                 total_loan_amount = COALESCE($7, total_loan_amount),
                 interest_rate = COALESCE($8, interest_rate),
                 term_months = COALESCE($9, term_months),
                 remaining_balance = COALESCE($10, remaining_balance),
                 provider = COALESCE($11, provider),
                 account_number = COALESCE($12, account_number),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $13 AND user_id = $14
             RETURNING *`,
      [
        name,
        amount,
        category,
        due_date,
        recurrence,
        status,
        totalLoanAmount,
        interestRate,
        termMonths,
        remainingBalance,
        provider,
        accountNumber,
        id,
        userId,
      ],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating loan:", error);
    res.status(500).json({ error: "Failed to update loan" });
  }
});

/**
 * @route   POST /api/loans/:id/payments
 * @desc    Record a loan payment
 * @access  Private
 */
router.post("/:id/payments", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount, paymentDate, spendingEntryId, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid payment amount required" });
    }

    // Start a transaction
    await db.query("BEGIN");

    // Get loan details
    const loanResult = await db.query(
      `SELECT * FROM bills_loans 
             WHERE id = $1 AND user_id = $2 AND type = 'loan'`,
      [id, userId],
    );

    if (loanResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Loan not found" });
    }

    const loan = loanResult.rows[0];

    // Calculate new remaining balance
    const currentBalance = parseFloat(loan.remaining_balance || loan.amount);
    const paymentAmount = parseFloat(amount);
    const newBalance = Math.max(0, currentBalance - paymentAmount);

    // Record payment
    const paymentResult = await db.query(
      `INSERT INTO loan_payments 
             (loan_id, user_id, amount, payment_date, payment_month, 
              remaining_balance, spending_entry_id, notes) 
             VALUES ($1, $2, $3, $4, DATE_TRUNC('month', $4::date), $5, $6, $7) 
             RETURNING *`,
      [
        id,
        userId,
        amount,
        paymentDate || new Date(),
        newBalance,
        spendingEntryId,
        notes,
      ],
    );

    // Update loan
    const updateResult = await db.query(
      `UPDATE bills_loans 
             SET remaining_balance = $1,
                 status = CASE WHEN $1 <= 0 THEN 'paid' ELSE status END,
                 last_paid = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
      [newBalance, paymentDate || new Date(), id],
    );

    await db.query("COMMIT");

    res.status(201).json({
      payment: paymentResult.rows[0],
      loan: updateResult.rows[0],
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error recording loan payment:", error);
    res.status(500).json({ error: "Failed to record loan payment" });
  }
});

/**
 * @route   PUT /api/loans/:id/paid
 * @desc    Mark a loan as paid
 * @access  Private
 */
router.put("/:id/paid", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      `UPDATE bills_loans 
       SET status = 'paid', 
           last_paid = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND type = 'loan'
       RETURNING *`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error marking loan as paid:", error);
    res.status(500).json({ error: "Failed to mark loan as paid" });
  }
});

/**
 * @route   PUT /api/loans/:id/unpaid
 * @desc    Mark a loan as unpaid
 * @access  Private
 */
router.put("/:id/unpaid", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      `UPDATE bills_loans 
       SET status = 'unpaid', 
           last_paid = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND type = 'loan'
       RETURNING *`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error marking loan as unpaid:", error);
    res.status(500).json({ error: "Failed to mark loan as unpaid" });
  }
});

/**
 * @route   GET /api/loans/:id/payments
 * @desc    Get all payments for a specific loan
 * @access  Private
 */
router.get("/:id/payments", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verify loan belongs to user
    const loanCheck = await db.query(
      "SELECT id FROM bills_loans WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (loanCheck.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const result = await db.query(
      `SELECT * FROM loan_payments 
             WHERE loan_id = $1 
             ORDER BY payment_date DESC`,
      [id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching loan payments:", error);
    res.status(500).json({ error: "Failed to fetch loan payments" });
  }
});

/**
 * @route   DELETE /api/loans/:id
 * @desc    Delete a loan
 * @access  Private
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      "DELETE FROM bills_loans WHERE id = $1 AND user_id = $2 AND type = $3 RETURNING id",
      [id, userId, "loan"],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    res.json({ message: "Loan deleted successfully", id: result.rows[0].id });
  } catch (error) {
    console.error("Error deleting loan:", error);
    res.status(500).json({ error: "Failed to delete loan" });
  }
});

/**
 * @route   GET /api/loans/analytics/summary
 * @desc    Get loan summary statistics
 * @access  Private
 */
router.get("/analytics/summary", auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Total loans, remaining balance, etc.
    const summary = await db.query(
      `SELECT 
                COUNT(*) as total_loans,
                COALESCE(SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END), 0) as active_loans,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as paid_loans,
                COALESCE(SUM(amount), 0) as total_monthly_payments,
                COALESCE(SUM(remaining_balance), 0) as total_remaining_balance,
                COALESCE(AVG(interest_rate), 0) as avg_interest_rate
             FROM bills_loans 
             WHERE user_id = $1 AND type = 'loan'`,
      [userId],
    );

    // Upcoming payments this month
    const upcoming = await db.query(
      `SELECT 
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as total_amount
             FROM bills_loans 
             WHERE user_id = $1 
                AND type = 'loan'
                AND status = 'unpaid'
                AND due_date >= DATE_TRUNC('month', CURRENT_DATE)
                AND due_date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')`,
      [userId],
    );

    res.json({
      summary: summary.rows[0],
      upcoming_payments: upcoming.rows[0],
    });
  } catch (error) {
    console.error("Error fetching loan summary:", error);
    res.status(500).json({ error: "Failed to fetch loan summary" });
  }
});

/**
 * @route   GET /api/loans/analytics/amortization/:id
 * @desc    Calculate loan amortization schedule
 * @access  Private
 */
router.get("/analytics/amortization/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM bills_loans 
             WHERE id = $1 AND user_id = $2 AND type = 'loan'`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const loan = result.rows[0];

    if (!loan.interest_rate || !loan.term_months) {
      return res.status(400).json({
        error: "Loan amortization requires interest_rate and term_months",
      });
    }

    // Calculate amortization schedule
    const principal = parseFloat(loan.amount);
    const annualRate = parseFloat(loan.interest_rate) / 100;
    const monthlyRate = annualRate / 12;
    const months = parseInt(loan.term_months);

    // Monthly payment using loan payment formula
    const monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1);

    let balance = principal;
    const schedule = [];

    for (let i = 1; i <= months; i++) {
      const interest = balance * monthlyRate;
      const principalPaid = monthlyPayment - interest;
      balance -= principalPaid;

      schedule.push({
        payment_number: i,
        payment_amount: monthlyPayment,
        principal_paid: principalPaid,
        interest_paid: interest,
        remaining_balance: Math.max(0, balance),
      });
    }

    res.json({
      loan_id: loan.id,
      loan_name: loan.name,
      principal: principal,
      annual_interest_rate: annualRate * 100,
      monthly_payment: monthlyPayment,
      total_payments: monthlyPayment * months,
      total_interest: monthlyPayment * months - principal,
      term_months: months,
      schedule: schedule,
    });
  } catch (error) {
    console.error("Error calculating amortization:", error);
    res.status(500).json({ error: "Failed to calculate amortization" });
  }
});

module.exports = router;
