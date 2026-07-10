const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const totals = await pool.query(`
      SELECT COALESCE(SUM(revenue),0) AS revenue, COUNT(*) AS orders,
             COALESCE(AVG(revenue),0) AS avg_order_value
      FROM sales_orders
    `);
    const monthly = await pool.query(`
      SELECT to_char(order_date,'Mon') AS month, SUM(revenue) AS revenue, COUNT(*) AS orders
      FROM sales_orders GROUP BY 1, date_trunc('month', order_date) ORDER BY date_trunc('month', order_date)
    `);
    const byRegion = await pool.query(`
      SELECT region, SUM(revenue) AS revenue FROM sales_orders GROUP BY region ORDER BY revenue DESC
    `);
    const topProducts = await pool.query(`
      SELECT product, SUM(units_sold) AS units_sold, SUM(revenue) AS revenue
      FROM sales_orders GROUP BY product ORDER BY revenue DESC LIMIT 6
    `);

    res.json({
      summary: {
        totalRevenueYTD: Number(totals.rows[0].revenue),
        totalOrdersYTD: Number(totals.rows[0].orders),
        avgOrderValue: Number(totals.rows[0].avg_order_value),
      },
      monthly: monthly.rows.map((r) => ({ month: r.month, revenue: Number(r.revenue), orders: Number(r.orders) })),
      byRegion: byRegion.rows.map((r) => ({ region: r.region, revenue: Number(r.revenue) })),
      topProducts: topProducts.rows.map((r) => ({
        product: r.product,
        unitsSold: Number(r.units_sold),
        revenue: Number(r.revenue),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load sales data." });
  }
});

module.exports = router;
