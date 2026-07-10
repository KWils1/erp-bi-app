const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const [salesYTD, ordersYTD, inventoryAlerts, financeYTD, monthlyRevenue, byRegion] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(revenue),0) AS total FROM sales_orders`),
      pool.query(`SELECT COUNT(*) AS total FROM sales_orders`),
      pool.query(`SELECT COUNT(*) AS total FROM inventory_items WHERE status IN ('low','critical')`),
      pool.query(`SELECT COALESCE(SUM(profit),0) AS total FROM finance_monthly`),
      pool.query(`
        SELECT to_char(order_date, 'Mon') AS month, SUM(revenue) AS revenue
        FROM sales_orders GROUP BY 1, date_trunc('month', order_date) ORDER BY date_trunc('month', order_date)
      `),
      pool.query(`
        SELECT region, SUM(revenue) AS revenue FROM sales_orders
        GROUP BY region ORDER BY revenue DESC
      `),
    ]);

    res.json({
      totalRevenueYTD: Number(salesYTD.rows[0].total),
      totalOrdersYTD: Number(ordersYTD.rows[0].total),
      totalProfitYTD: Number(financeYTD.rows[0].total),
      lowStockCount: Number(inventoryAlerts.rows[0].total),
      monthlyRevenue: monthlyRevenue.rows.map((r) => ({ month: r.month, revenue: Number(r.revenue) })),
      byRegion: byRegion.rows.map((r) => ({ region: r.region, revenue: Number(r.revenue) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard summary." });
  }
});

module.exports = router;
