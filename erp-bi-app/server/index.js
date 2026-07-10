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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ ERP BI server listening on http://localhost:${PORT}`);
});
