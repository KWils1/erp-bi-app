const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Account info + this user's notification preferences
router.get("/account", requireAuth, async (req, res) => {
  try {
    const prefs = await pool.query(
      `SELECT email_scheduled_reports, low_stock_alerts, weekly_digest
       FROM user_preferences WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({
      account: req.user,
      preferences: prefs.rows[0] || {
        email_scheduled_reports: true,
        low_stock_alerts: true,
        weekly_digest: false,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load account settings." });
  }
});

router.patch("/preferences", requireAuth, async (req, res) => {
  const { emailScheduledReports, lowStockAlerts, weeklyDigest } = req.body || {};
  try {
    const result = await pool.query(
      `UPDATE user_preferences SET
         email_scheduled_reports = COALESCE($1, email_scheduled_reports),
         low_stock_alerts = COALESCE($2, low_stock_alerts),
         weekly_digest = COALESCE($3, weekly_digest),
         updated_at = now()
       WHERE user_id = $4
       RETURNING email_scheduled_reports, low_stock_alerts, weekly_digest`,
      [emailScheduledReports, lowStockAlerts, weeklyDigest, req.user.id]
    );
    res.json({ preferences: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update preferences." });
  }
});

// Data & Security panel — real, live values instead of static copy:
// whether RBAC is active, audit logging status, and recent export activity.
router.get("/security", requireAuth, async (req, res) => {
  try {
    const settingsRows = await pool.query(`SELECT key, value FROM system_settings`);
    const settingsMap = {};
    settingsRows.rows.forEach((r) => (settingsMap[r.key] = r.value));

    const recentAudits = await pool.query(`
      SELECT al.action, al.created_at, u.name AS user_name, u.role AS user_role
      FROM audit_log al LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC LIMIT 10
    `);

    res.json({
      rbacEnabled: settingsMap.rbac_enabled ?? true,
      auditExportLogging: settingsMap.audit_export_logging ?? true,
      lowStockThresholdPct: settingsMap.low_stock_threshold_pct ?? 50,
      recentActivity: recentAudits.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load security settings." });
  }
});

// System-wide settings — admin only
router.patch("/system", requireAuth, requireRole("System Admin"), async (req, res) => {
  const { key, value } = req.body || {};
  if (!key) return res.status(400).json({ error: "A setting key is required." });
  try {
    const result = await pool.query(
      `INSERT INTO system_settings (key, value, updated_by, updated_at)
       VALUES ($1,$2,$3, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = now()
       RETURNING key, value`,
      [key, JSON.stringify(value), req.user.id]
    );
    res.json({ setting: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update system setting." });
  }
});

module.exports = router;
