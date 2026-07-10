import React, { useEffect, useState } from "react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api/client";
import { Card, KpiCard, SectionTitle, CustomTooltip, LoadingBlock, ErrorBlock } from "../components/UI";
import { C, fmtNaira, fmtNum, fmtCompact, FONT_UI, FONT_MONO } from "../theme";

const PIE_COLORS = [C.accent, "#3E9C94", "#6BB8B0", "#9FD4CD", C.warn, "#D4A94A"];

export default function SalesPage() {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/sales/summary").then((res) => setD(res.data)).catch((err) => setError(err.response?.data?.error || "Failed to load sales data."));
  }, []);

  if (error) return <ErrorBlock message={error} />;
  if (!d) return <LoadingBlock label="Loading sales data…" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard label="Revenue (YTD)" value={fmtCompact(d.summary.totalRevenueYTD)} sub="YTD" trend="up" />
        <KpiCard label="Total Orders" value={fmtNum(d.summary.totalOrdersYTD)} sub="across all regions" trend="up" />
        <KpiCard label="Avg. Order Value" value={fmtCompact(d.summary.avgOrderValue)} sub="per order" trend="flat" />
        <KpiCard label="Top Region" value={d.byRegion[0]?.region || "—"} sub={d.byRegion[0] ? fmtCompact(d.byRegion[0].revenue) : ""} trend="up" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Monthly Revenue &amp; Orders</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={d.monthly}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.accent} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={C.accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={fmtNaira} />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.accent} strokeWidth={2} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Revenue by Region</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={d.byRegion} dataKey="revenue" nameKey="region" innerRadius={55} outerRadius={90}>
                {d.byRegion.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={fmtNaira} />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle>Top Products by Revenue</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_UI }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
              {["Product", "Units Sold", "Revenue"].map((h) => (
                <th key={h} style={{ padding: "8px 6px", fontSize: 11, color: C.inkSoft, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.topProducts.map((p) => (
              <tr key={p.product} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px 6px", fontSize: 13, color: C.ink }}>{p.product}</td>
                <td style={{ padding: "10px 6px", fontSize: 13, fontFamily: FONT_MONO, color: C.ink }}>{fmtNum(p.unitsSold)}</td>
                <td style={{ padding: "10px 6px", fontSize: 13, fontFamily: FONT_MONO, color: C.ink }}>{fmtNaira(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
