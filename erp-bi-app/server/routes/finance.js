const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const totals = await pool.query(`
      SELECT COALESCE(SUM(revenue),0) AS revenue, COALESCE(SUM(profit),0) AS profit
      FROM finance_monthly
    `);
    const monthly = await pool.query(`SELECT month, revenue, cogs, opex, profit FROM finance_monthly ORDER BY id`);
    const expenseBreakdown = await pool.query(`SELECT category, value FROM finance_expense_breakdown ORDER BY value DESC`);

    const revenue = Number(totals.rows[0].revenue);
    const profit = Number(totals.rows[0].profit);
    const netMarginPct = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0;

    res.json({
      summary: {
        totalRevenueYTD: revenue,
        totalProfitYTD: profit,
        netMarginPct,
        cashPosition: Math.round(profit * 1.4), // illustrative — replace with real treasury data source
      },
      monthly: monthly.rows.map((r) => ({
        month: r.month,
        revenue: Number(r.revenue),
        cogs: Number(r.cogs),
        opex: Number(r.opex),
        profit: Number(r.profit),
      })),
      expenseBreakdown: expenseBreakdown.rows.map((r) => ({ category: r.category, value: Number(r.value) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load finance data." });
  }
});

module.exports = router;
