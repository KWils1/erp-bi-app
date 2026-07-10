import React, { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "../api/client";
import { Card, KpiCard, SectionTitle, CustomTooltip, LoadingBlock, ErrorBlock } from "../components/UI";
import { C, fmtNaira, fmtCompact, FONT_UI, FONT_MONO } from "../theme";

const PIE_COLORS = [C.accent, "#6BB8B0", C.warn, "#8B93A8"];

export default function FinancePage() {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/finance/summary").then((res) => setD(res.data)).catch((err) => setError(err.response?.data?.error || "Failed to load finance data."));
  }, []);

  if (error) return <ErrorBlock message={error} />;
  if (!d) return <LoadingBlock label="Loading finance data…" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard label="Revenue (YTD)" value={fmtCompact(d.summary.totalRevenueYTD)} sub="gross" trend="up" />
        <KpiCard label="Net Profit (YTD)" value={fmtCompact(d.summary.totalProfitYTD)} sub="after COGS & Opex" trend="up" />
        <KpiCard label="Net Margin" value={d.summary.netMarginPct + "%"} sub="profit / revenue" trend="up" />
        <KpiCard label="Cash Position" value={fmtCompact(d.summary.cashPosition)} sub="available" trend="flat" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Revenue, Cost &amp; Profit</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.monthly}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={fmtNaira} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="cogs" name="COGS" stackId="a" fill="#C9CDD8" />
              <Bar dataKey="opex" name="Opex" stackId="a" fill={C.warn} />
              <Bar dataKey="profit" name="Profit" stackId="a" fill={C.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Expense Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={d.expenseBreakdown} dataKey="value" nameKey="category" innerRadius={45} outerRadius={80}>
                {d.expenseBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={fmtNaira} />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle>Monthly Financial Summary</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_UI }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
              {["Month", "Revenue", "COGS", "Opex", "Profit"].map((h) => (
                <th key={h} style={{ padding: "8px 6px", fontSize: 11, color: C.inkSoft, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.monthly.map((m) => (
              <tr key={m.month} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "8px 6px", fontSize: 13, fontFamily: FONT_MONO, color: C.ink }}>{m.month}</td>
                <td style={{ padding: "8px 6px", fontSize: 12.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{fmtNaira(m.revenue)}</td>
                <td style={{ padding: "8px 6px", fontSize: 12.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{fmtNaira(m.cogs)}</td>
                <td style={{ padding: "8px 6px", fontSize: 12.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{fmtNaira(m.opex)}</td>
                <td style={{ padding: "8px 6px", fontSize: 13, fontFamily: FONT_MONO, fontWeight: 600, color: C.accent }}>{fmtNaira(m.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
