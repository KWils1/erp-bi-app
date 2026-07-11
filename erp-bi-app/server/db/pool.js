require("dotenv").config();

const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for secure Render database connections
      },
    })
  : new Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || "erp_bi",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
    });

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

module.exports = pool;
