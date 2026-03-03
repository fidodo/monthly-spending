const express = require("express");
const router = express.Router();
const db = require("../database/db");
const auth = require("../middleware/auth");

/** * @route   GET /api/archive
 * @desc    Get all archived entries for logged in user
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT * FROM archived_entries 
               WHERE user_id = $1 
               ORDER BY date DESC, created_at DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching archived entries:", error);
    res.status(500).json({ error: "Failed to fetch archived entries" });
  }
});

/** * @route   POST /api/archive
 * @desc    Create a new archived entry
 * @access  Private
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { type, amount, category, date, description } = req.body;

    const result = await db.query(
      `INSERT INTO archived_entries (user_id, type, amount, category, date, description) 
               VALUES ($1, $2, $3, $4, $5, $6) 
               RETURNING *`,
      [userId, type, amount, category, date, description],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating archived entry:", error);
    res.status(500).json({ error: "Failed to create archived entry" });
  }
});

/** * @route   DELETE /api/archive/:id
 * @desc    Delete an archived entry
 * @access  Private
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await db.query(
      "DELETE FROM archived_entries WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Archived entry not found" });
    }

    res.json({ message: "Archived entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting archived entry:", error);
    res.status(500).json({ error: "Failed to delete archived entry" });
  }
});

module.exports = router;
