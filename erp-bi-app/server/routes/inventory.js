const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const totals = await pool.query(`
      SELECT COUNT(*) AS total_skus,
             COUNT(*) FILTER (WHERE status IN ('low','critical')) AS low_stock_count,
             COALESCE(SUM(stock * unit_value),0) AS total_stock_value
      FROM inventory_items
    `);
    const trend = await pool.query(`SELECT month, units_on_hand FROM inventory_trend ORDER BY id`);
    const items = await pool.query(`
      SELECT sku, name, warehouse, stock, reorder_level, status
      FROM inventory_items ORDER BY status DESC, name
    `);

    res.json({
      summary: {
        totalSkus: Number(totals.rows[0].total_skus),
        lowStockCount: Number(totals.rows[0].low_stock_count),
        totalStockValue: Number(totals.rows[0].total_stock_value),
        turnoverRate: 4.2,
      },
      trend: trend.rows.map((r) => ({ month: r.month, unitsOnHand: Number(r.units_on_hand) })),
      items: items.rows.map((r) => ({
        sku: r.sku,
        name: r.name,
        warehouse: r.warehouse,
        stock: Number(r.stock),
        reorderLevel: Number(r.reorder_level),
        status: r.status,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load inventory data." });
  }
});

module.exports = router;
