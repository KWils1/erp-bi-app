const express = require("express");
const XLSX = require("xlsx");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function buildFilters(query) {
  const { department, branch, category, type, startDate, endDate } = query;
  const clauses = [];
  const params = [];
  let i = 1;

  if (department && department !== "All") {
    clauses.push(`department = $${i++}`);
    params.push(department);
  }
  if (branch && branch !== "All") {
    clauses.push(`branch = $${i++}`);
    params.push(branch);
  }
  if (category && category !== "All") {
    clauses.push(`category = $${i++}`);
    params.push(category);
  }
  if (type && type !== "All") {
    clauses.push(`type = $${i++}`);
    params.push(type);
  }
  if (startDate) {
    clauses.push(`txn_date >= $${i++}`);
    params.push(startDate);
  }
  if (endDate) {
    clauses.push(`txn_date <= $${i++}`);
    params.push(endDate);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
}

// Filter metadata (dropdown options)
router.get("/meta", requireAuth, async (req, res) => {
  try {
    const [departments, branches, categories] = await Promise.all([
      pool.query(`SELECT DISTINCT department FROM transactions ORDER BY department`),
      pool.query(`SELECT DISTINCT branch FROM transactions ORDER BY branch`),
      pool.query(`SELECT DISTINCT category FROM transactions ORDER BY category`),
    ]);
    res.json({
      departments: departments.rows.map((r) => r.department),
      branches: branches.rows.map((r) => r.branch),
      categories: categories.rows.map((r) => r.category),
      types: ["Sale", "Purchase", "Return", "Adjustment"],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load report filter options." });
  }
});

// Filtered transaction list + summary
router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const { where, params } = buildFilters(req.query);
    const limit = Math.min(Number(req.query.limit) || 200, 1000);

    const rows = await pool.query(
      `SELECT txn_code AS id, txn_date AS date, department, branch, category, type, amount
       FROM transactions ${where} ORDER BY txn_date DESC LIMIT ${limit}`,
      params
    );
    const summary = await pool.query(
      `SELECT
         COUNT(*) AS count,
         COALESCE(SUM(amount),0) AS total,
         COALESCE(SUM(amount) FILTER (WHERE type = 'Sale'),0) AS sales,
         COALESCE(SUM(amount) FILTER (WHERE type = 'Purchase'),0) AS purchases
       FROM transactions ${where}`,
      params
    );
    const byCategory = await pool.query(
      `SELECT category, COALESCE(SUM(amount),0) AS value FROM transactions ${where} GROUP BY category ORDER BY value DESC`,
      params
    );

    res.json({
      transactions: rows.rows,
      summary: {
        count: Number(summary.rows[0].count),
        total: Number(summary.rows[0].total),
        sales: Number(summary.rows[0].sales),
        purchases: Number(summary.rows[0].purchases),
      },
      chartData: byCategory.rows.map((r) => ({ category: r.category, value: Number(r.value) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load transactions." });
  }
});

// CSV export (streams the full filtered set, not just the on-screen page)
router.get("/export/csv", requireAuth, async (req, res) => {
  try {
    const { where, params } = buildFilters(req.query);
    const result = await pool.query(
      `SELECT txn_code, txn_date, department, branch, category, type, amount
       FROM transactions ${where} ORDER BY txn_date DESC`,
      params
    );

    const header = ["Transaction ID", "Date", "Department", "Branch", "Category", "Type", "Amount"];
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [header.map(escape).join(",")];
    result.rows.forEach((r) => {
      lines.push(
        [r.txn_code, r.txn_date.toISOString().slice(0, 10), r.department, r.branch, r.category, r.type, r.amount]
          .map(escape)
          .join(",")
      );
    });

    await pool.query(
      `INSERT INTO audit_log (user_id, action, details) VALUES ($1,'export_csv',$2)`,
      [req.user.id, JSON.stringify({ rowCount: result.rows.length, filters: req.query })]
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="BI_Report.csv"`);
    res.send(lines.join("\n"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export CSV." });
  }
});

// Excel export (Summary + Transactions sheets)
router.get("/export/excel", requireAuth, async (req, res) => {
  try {
    const { where, params } = buildFilters(req.query);
    const result = await pool.query(
      `SELECT txn_code AS "Transaction ID", txn_date AS "Date", department AS "Department",
              branch AS "Branch", category AS "Category", type AS "Type", amount AS "Amount"
       FROM transactions ${where} ORDER BY txn_date DESC`,
      params
    );
    const summary = await pool.query(
      `SELECT
         COUNT(*) AS count, COALESCE(SUM(amount),0) AS total,
         COALESCE(SUM(amount) FILTER (WHERE type = 'Sale'),0) AS sales,
         COALESCE(SUM(amount) FILTER (WHERE type = 'Purchase'),0) AS purchases
       FROM transactions ${where}`,
      params
    );

    const wb = XLSX.utils.book_new();
    const summaryWs = XLSX.utils.json_to_sheet([
      { Metric: "Total Transactions", Value: Number(summary.rows[0].count) },
      { Metric: "Total Sales", Value: Number(summary.rows[0].sales) },
      { Metric: "Total Purchases", Value: Number(summary.rows[0].purchases) },
      { Metric: "Net Total", Value: Number(summary.rows[0].total) },
    ]);
    const txnRows = result.rows.map((r) => ({
      ...r,
      Date: r.Date.toISOString().slice(0, 10),
      Amount: Number(r.Amount),
    }));
    const txnWs = XLSX.utils.json_to_sheet(txnRows);
    txnWs["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 14 }];

    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    XLSX.utils.book_append_sheet(wb, txnWs, "Transactions");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    await pool.query(
      `INSERT INTO audit_log (user_id, action, details) VALUES ($1,'export_excel',$2)`,
      [req.user.id, JSON.stringify({ rowCount: result.rows.length, filters: req.query })]
    );

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="BI_Report.xlsx"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export Excel file." });
  }
});

module.exports = router;
