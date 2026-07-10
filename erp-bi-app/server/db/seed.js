const bcrypt = require("bcryptjs");
const pool = require("./pool");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const MONTH_NUM = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07" };
const REGIONS = ["Lagos", "Abuja", "Ibadan", "Kano", "Port Harcourt", "Enugu"];
const PRODUCTS = ["Cement Bags", "Roofing Sheets", "Steel Rods", "Paint (20L)", "Ceramic Tiles", "PVC Pipes"];
const SUPPLIERS = ["Dangote Industries", "BUA Group", "Lafarge Africa", "Julius Berger Supplies", "Nigerian Breweries Logistics"];
const WAREHOUSES = ["Lagos Central", "Abuja Depot", "Kano Storage", "PH Warehouse"];
const DEPARTMENTS = ["Sales", "Finance", "Procurement", "Inventory", "Operations"];
const BRANCHES = ["Lagos HQ", "Abuja Branch", "Ibadan Branch", "Kano Branch", "PH Branch"];
const CATEGORIES = ["Building Materials", "Logistics", "Equipment", "Utilities", "Payroll", "Marketing"];
const TXN_TYPES = ["Sale", "Purchase", "Return", "Adjustment"];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}
function money(min, max) {
  return Math.round(rand(min, max) / 100) * 100;
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Seeding database:", process.env.PGDATABASE);
    await client.query("BEGIN");

    // ---------- Clear existing demo data (idempotent re-seed) ----------
    await client.query(`
      TRUNCATE TABLE
        audit_log, import_history, user_preferences,
        transactions, finance_expense_breakdown, finance_monthly,
        purchase_orders, inventory_trend, inventory_items,
        sales_orders, system_settings, users
      RESTART IDENTITY CASCADE
    `);

    // ---------- Users ----------
    const demoAccounts = [
      { name: "Bakare Adewale", email: "admin@lautech-erp.edu.ng", password: "Admin@123", role: "System Admin", department: "Operations" },
      { name: "Tolu Ogunleye", email: "analyst@lautech-erp.edu.ng", password: "Analyst@123", role: "Analyst", department: "Finance" },
      { name: "Kunle Adebayo", email: "manager@lautech-erp.edu.ng", password: "Manager@123", role: "Manager", department: "Sales" },
      { name: "Bisi Yusuf", email: "bisi.yusuf@lautech-erp.edu.ng", password: "Viewer@123", role: "Viewer", department: "Inventory" },
    ];
    const userIds = {};
    for (const acct of demoAccounts) {
      const hash = await bcrypt.hash(acct.password, 10);
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role, department, status, last_login)
         VALUES ($1,$2,$3,$4,$5,'Active', now() - interval '1 day' * $6)
         RETURNING id`,
        [acct.name, acct.email, hash, acct.role, acct.department, rand(0, 5)]
      );
      userIds[acct.email] = res.rows[0].id;
      await client.query(
        `INSERT INTO user_preferences (user_id) VALUES ($1)`,
        [res.rows[0].id]
      );
    }

    // ---------- Sales orders (monthly, by region/product) ----------
    let poCounter = 11000;
    let orderCounter = 20000;
    for (const month of MONTHS) {
      const ordersThisMonth = rand(150, 220);
      for (let i = 0; i < ordersThisMonth; i++) {
        const day = String(rand(1, 28)).padStart(2, "0");
        const units = rand(5, 300);
        const revenue = money(50000, 4500000);
        await client.query(
          `INSERT INTO sales_orders (order_number, order_date, region, product, units_sold, revenue, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            `SO-${orderCounter++}`,
            `2026-${MONTH_NUM[month]}-${day}`,
            pick(REGIONS),
            pick(PRODUCTS),
            units,
            revenue,
            pick(["Delivered", "In Transit", "Pending Approval", "Delayed"]),
          ]
        );
      }
    }

    // ---------- Inventory ----------
    for (const product of PRODUCTS) {
      for (const wh of WAREHOUSES) {
        const stock = rand(20, 5000);
        const reorder = rand(200, 800);
        const status = stock < reorder * 0.5 ? "critical" : stock < reorder ? "low" : "healthy";
        await client.query(
          `INSERT INTO inventory_items (sku, name, warehouse, stock, reorder_level, unit_value, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            `SKU-${product.slice(0, 3).toUpperCase()}-${wh.slice(0, 2).toUpperCase()}`,
            product,
            wh,
            stock,
            reorder,
            money(500, 25000),
            status,
          ]
        );
      }
    }
    let unitsOnHand = 18000;
    for (const month of MONTHS) {
      unitsOnHand += rand(-1200, 900);
      await client.query(
        `INSERT INTO inventory_trend (month, units_on_hand) VALUES ($1,$2)`,
        [month, Math.max(unitsOnHand, 1000)]
      );
    }

    // ---------- Procurement ----------
    for (const month of MONTHS) {
      const posThisMonth = rand(8, 20);
      for (let i = 0; i < posThisMonth; i++) {
        const day = String(rand(1, 28)).padStart(2, "0");
        await client.query(
          `INSERT INTO purchase_orders (po_number, supplier, order_date, amount, status, lead_time_days)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            `PO-2026${poCounter++}`,
            pick(SUPPLIERS),
            `2026-${MONTH_NUM[month]}-${day}`,
            money(200000, 12000000),
            pick(["Delivered", "In Transit", "Pending Approval", "Delayed"]),
            rand(3, 21),
          ]
        );
      }
    }

    // ---------- Finance ----------
    for (const month of MONTHS) {
      const revenue = money(6000000, 9500000);
      const cogs = Math.round(revenue * (0.45 + Math.random() * 0.1));
      const opex = Math.round(revenue * (0.15 + Math.random() * 0.08));
      const profit = revenue - cogs - opex;
      await client.query(
        `INSERT INTO finance_monthly (month, revenue, cogs, opex, profit) VALUES ($1,$2,$3,$4,$5)`,
        [month, revenue, cogs, opex, profit]
      );
    }
    const expenseCats = [
      { category: "Logistics", value: money(4000000, 9000000) },
      { category: "Payroll", value: money(8000000, 15000000) },
      { category: "Utilities", value: money(1000000, 3000000) },
      { category: "Marketing", value: money(1500000, 4000000) },
    ];
    for (const e of expenseCats) {
      await client.query(
        `INSERT INTO finance_expense_breakdown (category, value) VALUES ($1,$2)`,
        [e.category, e.value]
      );
    }

    // ---------- Transactions (for Report Generation module) ----------
    let txnCounter = 10000;
    for (const month of MONTHS) {
      const txnsThisMonth = rand(180, 260);
      for (let i = 0; i < txnsThisMonth; i++) {
        const day = String(rand(1, 28)).padStart(2, "0");
        const type = pick(TXN_TYPES);
        const amount = type === "Return" ? -money(10000, 800000) : money(10000, 2500000);
        await client.query(
          `INSERT INTO transactions (txn_code, txn_date, department, branch, category, type, amount)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            `TXN-${txnCounter++}`,
            `2026-${MONTH_NUM[month]}-${day}`,
            pick(DEPARTMENTS),
            pick(BRANCHES),
            pick(CATEGORIES),
            type,
            amount,
          ]
        );
      }
    }

    // ---------- Import history ----------
    await client.query(
      `INSERT INTO import_history (file_name, rows_count, status, imported_by, created_at) VALUES
       ('sales_transactions_q2_2026.csv', 412, 'Processed', $1, now() - interval '5 days'),
       ('inventory_snapshot_jul.xlsx', 8, 'Processed', $1, now() - interval '5 days'),
       ('procurement_orders_h1.csv', 84, 'Processed', $1, now() - interval '10 days')`,
      [userIds["admin@lautech-erp.edu.ng"]]
    );

    // ---------- System settings ----------
    await client.query(
      `INSERT INTO system_settings (key, value, updated_by) VALUES
       ('low_stock_threshold_pct', '50', $1),
       ('rbac_enabled', 'true', $1),
       ('audit_export_logging', 'true', $1)`,
      [userIds["admin@lautech-erp.edu.ng"]]
    );

    await client.query("COMMIT");
    console.log("✅ Seed complete.");
    console.log("Demo accounts:");
    demoAccounts.forEach((a) => console.log(`  ${a.role.padEnd(14)} ${a.email}  /  ${a.password}`));
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
