const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const pool = require("../db/pool");
const { signToken } = require("../utils/jwt");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Throttle login attempts to slow down brute-force guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, department, status FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    const user = result.rows[0];

    // Same error message whether the email doesn't exist or the password is wrong,
    // so we don't leak which emails are registered.
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password." });

    if (user.status !== "Active") {
      return res.status(403).json({ error: "This account has been deactivated." });
    }

    await pool.query(`UPDATE users SET last_login = now() WHERE id = $1`, [user.id]);

    const token = signToken({ sub: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed due to a server error." });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are required." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  try {
    const result = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect." });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [
      newHash,
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update password." });
  }
});

module.exports = router;
