const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const totals = await pool.query(`
      SELECT COUNT(*) AS total_pos, COALESCE(SUM(amount),0) AS total_spend,
             COUNT(*) FILTER (WHERE status = 'Pending Approval') AS pending_approvals,
             COALESCE(AVG(lead_time_days),0) AS avg_lead_time
      FROM purchase_orders
    `);
    const monthly = await pool.query(`
      SELECT to_char(order_date,'Mon') AS month, SUM(amount) AS spend
      FROM purchase_orders GROUP BY 1, date_trunc('month', order_date) ORDER BY date_trunc('month', order_date)
    `);
    const bySupplier = await pool.query(`
      SELECT supplier, SUM(amount) AS spend FROM purchase_orders
      GROUP BY supplier ORDER BY spend DESC LIMIT 6
    `);
    const orders = await pool.query(`
      SELECT po_number, supplier, order_date, amount, status
      FROM purchase_orders ORDER BY order_date DESC LIMIT 50
    `);

    res.json({
      summary: {
        totalPOsYTD: Number(totals.rows[0].total_pos),
        totalSpendYTD: Number(totals.rows[0].total_spend),
        pendingApprovals: Number(totals.rows[0].pending_approvals),
        avgLeadTimeDays: Math.round(Number(totals.rows[0].avg_lead_time)),
      },
      monthly: monthly.rows.map((r) => ({ month: r.month, spend: Number(r.spend) })),
      bySupplier: bySupplier.rows.map((r) => ({ supplier: r.supplier, spend: Number(r.spend) })),
      orders: orders.rows.map((r) => ({
        poNumber: r.po_number,
        supplier: r.supplier,
        orderDate: r.order_date,
        amount: Number(r.amount),
        status: r.status,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load procurement data." });
  }
});

module.exports = router;
