-- ERP BI Reporting Tool — PostgreSQL Schema
-- Run via: npm run migrate

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(30) NOT NULL CHECK (role IN ('System Admin', 'Manager', 'Analyst', 'Viewer')),
  department    VARCHAR(60),
  status        VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number  VARCHAR(30) NOT NULL UNIQUE,
  order_date    DATE NOT NULL,
  region        VARCHAR(60) NOT NULL,
  product       VARCHAR(120) NOT NULL,
  units_sold    INTEGER NOT NULL DEFAULT 0,
  revenue       NUMERIC(14,2) NOT NULL DEFAULT 0,
  status        VARCHAR(30) NOT NULL DEFAULT 'Delivered',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_region ON sales_orders(region);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku            VARCHAR(40) NOT NULL UNIQUE,
  name           VARCHAR(160) NOT NULL,
  warehouse      VARCHAR(80) NOT NULL,
  stock          INTEGER NOT NULL DEFAULT 0,
  reorder_level  INTEGER NOT NULL DEFAULT 0,
  unit_value     NUMERIC(12,2) NOT NULL DEFAULT 0,
  status         VARCHAR(20) NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'low', 'critical')),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_trend (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month         VARCHAR(10) NOT NULL,
  units_on_hand INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- PROCUREMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number    VARCHAR(30) NOT NULL UNIQUE,
  supplier     VARCHAR(160) NOT NULL,
  order_date   DATE NOT NULL,
  amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  status       VARCHAR(30) NOT NULL DEFAULT 'Pending Approval',
  lead_time_days INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_po_date ON purchase_orders(order_date);

-- ============================================================
-- FINANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS finance_monthly (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month    VARCHAR(10) NOT NULL,
  revenue  NUMERIC(14,2) NOT NULL DEFAULT 0,
  cogs     NUMERIC(14,2) NOT NULL DEFAULT 0,
  opex     NUMERIC(14,2) NOT NULL DEFAULT 0,
  profit   NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS finance_expense_breakdown (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(80) NOT NULL,
  value    NUMERIC(14,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- TRANSACTIONS (used by Report Generation module)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_code    VARCHAR(30) NOT NULL UNIQUE,
  txn_date    DATE NOT NULL,
  department  VARCHAR(60) NOT NULL,
  branch      VARCHAR(80) NOT NULL,
  category    VARCHAR(80) NOT NULL,
  type        VARCHAR(30) NOT NULL CHECK (type IN ('Sale', 'Purchase', 'Return', 'Adjustment')),
  amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(txn_date);
CREATE INDEX IF NOT EXISTS idx_txn_dept ON transactions(department);
CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);

-- ============================================================
-- DATA IMPORT HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS import_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name    VARCHAR(200) NOT NULL,
  rows_count   INTEGER NOT NULL DEFAULT 0,
  status       VARCHAR(20) NOT NULL DEFAULT 'Processed',
  imported_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- AUDIT LOG (exports, admin actions)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(120) NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SETTINGS (per-user preferences, and system-wide settings for admins)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id                UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_scheduled_reports BOOLEAN NOT NULL DEFAULT true,
  low_stock_alerts        BOOLEAN NOT NULL DEFAULT true,
  weekly_digest           BOOLEAN NOT NULL DEFAULT false,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key         VARCHAR(80) PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
