const fs = require("fs");
const path = require("path");
const pool = require("./pool");

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  console.log("Running migrations against database:", process.env.PGDATABASE);
  try {
    await pool.query(sql);
    console.log("✅ Migration complete — all tables created (or already existed).");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
