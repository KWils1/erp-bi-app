const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const VALID_ROLES = ["System Admin", "Manager", "Analyst", "Viewer"];

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, department, status, last_login
      FROM users ORDER BY created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load users." });
  }
});

router.post("/", requireAuth, requireRole("System Admin"), async (req, res) => {
  const { name, email, role, department } = req.body || {};
  if (!name || !email || !role) {
    return res.status(400).json({ error: "Name, email, and role are required." });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }

  try {
    // Generate a temporary password; in production, email this to the user via a
    // secure invite flow instead of returning it directly.
    const tempPassword = crypto.randomBytes(9).toString("base64url");
    const hash = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, status)
       VALUES ($1,$2,$3,$4,$5,'Active')
       RETURNING id, name, email, role, department, status`,
      [name, email.trim().toLowerCase(), hash, role, department || null]
    );
    await pool.query(`INSERT INTO user_preferences (user_id) VALUES ($1)`, [result.rows[0].id]);
    await pool.query(
      `INSERT INTO audit_log (user_id, action, details) VALUES ($1,'create_user',$2)`,
      [req.user.id, JSON.stringify({ createdUserId: result.rows[0].id })]
    );

    res.status(201).json({ user: result.rows[0], temporaryPassword: tempPassword });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A user with that email already exists." });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create user." });
  }
});

router.patch("/:id/status", requireAuth, requireRole("System Admin"), async (req, res) => {
  const { status } = req.body || {};
  if (!["Active", "Inactive"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'Active' or 'Inactive'." });
  }
  try {
    const result = await pool.query(
      `UPDATE users SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, status`,
      [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "User not found." });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user status." });
  }
});

router.delete("/:id", requireAuth, requireRole("System Admin"), async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot remove your own account." });
  }
  try {
    const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: "User not found." });
    await pool.query(
      `INSERT INTO audit_log (user_id, action, details) VALUES ($1,'delete_user',$2)`,
      [req.user.id, JSON.stringify({ deletedUserId: req.params.id })]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove user." });
  }
});

module.exports = router;
