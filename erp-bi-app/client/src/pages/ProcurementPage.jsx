import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api/client";
import { Card, KpiCard, SectionTitle, StatusPill, CustomTooltip, LoadingBlock, ErrorBlock } from "../components/UI";
import { C, fmtNaira, fmtNum, fmtCompact, FONT_UI, FONT_MONO } from "../theme";

export default function ProcurementPage() {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/procurement/summary").then((res) => setD(res.data)).catch((err) => setError(err.response?.data?.error || "Failed to load procurement data."));
  }, []);

  if (error) return <ErrorBlock message={error} />;
  if (!d) return <LoadingBlock label="Loading procurement data…" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard label="Purchase Orders (YTD)" value={fmtNum(d.summary.totalPOsYTD)} sub="total" trend="up" />
        <KpiCard label="Total Spend (YTD)" value={fmtCompact(d.summary.totalSpendYTD)} sub="across suppliers" trend="up" />
        <KpiCard label="Pending Approvals" value={fmtNum(d.summary.pendingApprovals)} sub="awaiting sign-off" trend="down" />
        <KpiCard label="Avg. Lead Time" value={d.summary.avgLeadTimeDays + " days"} sub="order to delivery" trend="flat" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Monthly Procurement Spend</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={d.monthly}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={fmtNaira} />} />
              <Bar dataKey="spend" name="Spend" fill={C.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Spend by Supplier</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            {d.bySupplier.map((s) => {
              const max = d.bySupplier[0]?.spend || 1;
              const pct = (s.spend / max) * 100;
              return (
                <div key={s.supplier}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.ink, marginBottom: 4 }}>
                    <span>{s.supplier}</span>
                    <span style={{ fontFamily: FONT_MONO, fontWeight: 600 }}>{fmtCompact(s.spend)}</span>
                  </div>
                  <div style={{ background: C.border, borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${pct}%`, background: C.accent, height: 6, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>Purchase Orders</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_UI }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
              {["PO Number", "Supplier", "Order Date", "Amount", "Status"].map((h) => (
                <th key={h} style={{ padding: "8px 6px", fontSize: 11, color: C.inkSoft, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.orders.map((po) => (
              <tr key={po.poNumber} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px 6px", fontSize: 12.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{po.poNumber}</td>
                <td style={{ padding: "10px 6px", fontSize: 13, color: C.ink }}>{po.supplier}</td>
                <td style={{ padding: "10px 6px", fontSize: 12.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{new Date(po.orderDate).toISOString().slice(0, 10)}</td>
                <td style={{ padding: "10px 6px", fontSize: 13, fontFamily: FONT_MONO, fontWeight: 600, color: C.ink }}>{fmtNaira(po.amount)}</td>
                <td style={{ padding: "10px 6px" }}><StatusPill status={po.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
