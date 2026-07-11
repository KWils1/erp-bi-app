require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const salesRoutes = require("./routes/sales");
const inventoryRoutes = require("./routes/inventory");
const procurementRoutes = require("./routes/procurement");
const financeRoutes = require("./routes/finance");
const reportsRoutes = require("./routes/reports");
const importRoutes = require("./routes/imports");
const userRoutes = require("./routes/users");
const settingsRoutes = require("./routes/settings");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/imports", importRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);

// 404 handler
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Central error handler (catches anything thrown synchronously in routes)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
});

const pool = require('./db/pool');
const fs = require('fs');
const path = require('path');

// Automatically run schema if tables don't exist
async function initDb() {
  try {
    // Check if users table already exists to prevent wiping data
    const res = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!res.rows[0].exists) {
      console.log("Database empty. Initializing schema...");
      const schemaPath = path.join(__dirname, 'db', 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log("Schema initialized successfully.");

      // Run database seeds to add demo accounts
      const seedPath = path.join(__dirname, 'db', 'seed.js');
      if (fs.existsSync(seedPath)) {
        console.log("Running database seeds...");
        // This will execute your seed file directly
        require(seedPath); 
        console.log("Database seeding completed.");
      }
    }
  } catch (err) {
    console.error("Error initializing database on startup:", err);
  }
}

initDb();
