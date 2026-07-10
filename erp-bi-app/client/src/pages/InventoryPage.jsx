import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api/client";
import { Card, KpiCard, SectionTitle, StatusPill, CustomTooltip, LoadingBlock, ErrorBlock } from "../components/UI";
import { C, fmtNum, fmtCompact, FONT_UI, FONT_MONO } from "../theme";

export default function InventoryPage() {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/inventory/summary").then((res) => setD(res.data)).catch((err) => setError(err.response?.data?.error || "Failed to load inventory data."));
  }, []);

  if (error) return <ErrorBlock message={error} />;
  if (!d) return <LoadingBlock label="Loading inventory data…" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard label="Total SKUs" value={fmtNum(d.summary.totalSkus)} sub="active items" trend="flat" />
        <KpiCard label="Low / Critical Stock" value={fmtNum(d.summary.lowStockCount)} sub="need reordering" trend="down" />
        <KpiCard label="Total Stock Value" value={fmtCompact(d.summary.totalStockValue)} sub="at cost" trend="up" />
        <KpiCard label="Turnover Rate" value={d.summary.turnoverRate + "x"} sub="per year" trend="up" />
      </div>

      <Card>
        <SectionTitle>Units on Hand — Trend</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={d.trend}>
            <CartesianGrid stroke={C.border} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: C.inkSoft }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip formatter={fmtNum} />} />
            <Line type="monotone" dataKey="unitsOnHand" name="Units on Hand" stroke={C.accent} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>Stock by SKU</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_UI }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
              {["SKU", "Item", "Warehouse", "Stock", "Reorder Level", "Status"].map((h) => (
                <th key={h} style={{ padding: "8px 6px", fontSize: 11, color: C.inkSoft, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.items.map((it) => (
              <tr key={it.sku} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px 6px", fontSize: 12.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{it.sku}</td>
                <td style={{ padding: "10px 6px", fontSize: 13, color: C.ink }}>{it.name}</td>
                <td style={{ padding: "10px 6px", fontSize: 12.5, color: C.inkSoft }}>{it.warehouse}</td>
                <td style={{ padding: "10px 6px", fontSize: 13, fontFamily: FONT_MONO, fontWeight: 600, color: C.ink }}>{fmtNum(it.stock)}</td>
                <td style={{ padding: "10px 6px", fontSize: 12.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{fmtNum(it.reorderLevel)}</td>
                <td style={{ padding: "10px 6px" }}><StatusPill status={it.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
