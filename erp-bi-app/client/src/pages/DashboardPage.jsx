import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Package } from "lucide-react";
import api from "../api/client";
import { Card, KpiCard, SectionTitle, CustomTooltip, LoadingBlock, ErrorBlock } from "../components/UI";
import { C, fmtNaira, fmtNum, fmtCompact } from "../theme";

const PIE_COLORS = [C.accent, "#3E9C94", "#6BB8B0", "#9FD4CD", C.warn, "#D4A94A"];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load dashboard data."));
  }, []);

  if (error) return <ErrorBlock message={error} />;
  if (!data) return <LoadingBlock label="Loading dashboard…" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard label="Revenue (YTD)" value={fmtCompact(data.totalRevenueYTD)} sub="year to date" trend="up" />
        <KpiCard label="Total Sales Orders" value={fmtNum(data.totalOrdersYTD)} sub="YTD" trend="up" />
        <KpiCard label="Net Profit (YTD)" value={fmtCompact(data.totalProfitYTD)} sub="after COGS & Opex" trend="up" />
        <KpiCard label="Inventory Alerts" value={fmtNum(data.lowStockCount)} sub="SKUs need attention" trend="down" icon={Package} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Monthly Revenue Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data.monthlyRevenue}>
              <defs>
                <linearGradient id="revFillDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.accent} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={C.accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={fmtNaira} />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.accent} strokeWidth={2} fill="url(#revFillDash)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Revenue by Region</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={data.byRegion} dataKey="revenue" nameKey="region" innerRadius={45} outerRadius={80}>
                {data.byRegion.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={fmtNaira} />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
