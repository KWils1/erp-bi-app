const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const pool = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
  fileFilter: (req, file, cb) => {
    const ok = /\.(csv|xlsx|xls)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only .csv, .xlsx, and .xls files are supported."), ok);
  },
});

router.get("/history", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ih.id, ih.file_name, ih.rows_count, ih.status, ih.created_at, u.name AS imported_by
      FROM import_history ih LEFT JOIN users u ON u.id = ih.imported_by
      ORDER BY ih.created_at DESC LIMIT 50
    `);
    res.json({ history: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load import history." });
  }
});

// Expected columns per row: date, department, branch, category, type, amount
// Extra/missing columns are tolerated; invalid rows are skipped and reported.
router.post("/upload", requireAuth, requireRole("System Admin", "Manager", "Analyst"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    let inserted = 0;
    let skipped = 0;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const row of rows) {
        const date = row.date || row.Date || row.txn_date;
        const department = row.department || row.Department;
        const branch = row.branch || row.Branch;
        const category = row.category || row.Category;
        const type = row.type || row.Type;
        const amount = Number(row.amount ?? row.Amount);

        if (!date || !department || !branch || !category || !type || Number.isNaN(amount)) {
          skipped++;
          continue;
        }

        const parsedDate = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
        const txnCode = `TXN-IMP-${Date.now()}-${inserted}`;

        await client.query(
          `INSERT INTO transactions (txn_code, txn_date, department, branch, category, type, amount)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [txnCode, parsedDate, department, branch, category, type, amount]
        );
        inserted++;
      }

      await client.query(
        `INSERT INTO import_history (file_name, rows_count, status, imported_by) VALUES ($1,$2,$3,$4)`,
        [req.file.originalname, inserted, skipped > 0 ? "Processed with warnings" : "Processed", req.user.id]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.json({ inserted, skipped, totalRows: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process the uploaded file. Please check its format." });
  }
});

module.exports = router;
