import React, { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Filter, FileDown, FileSpreadsheet, FileText, CheckCircle2 } from "lucide-react";
import api from "../api/client";
import { Card, SectionTitle, CustomTooltip, LoadingBlock, ErrorBlock } from "../components/UI";
import { C, fmtNaira, fmtCompact, FONT_UI, FONT_MONO } from "../theme";

export default function ReportGenerationPage() {
  const [meta, setMeta] = useState(null);
  const [dept, setDept] = useState("All");
  const [branch, setBranch] = useState("All");
  const [category, setCategory] = useState("All");
  const [ttype, setTtype] = useState("All");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  useEffect(() => {
    api.get("/reports/meta").then((res) => setMeta(res.data)).catch(() => {});
  }, []);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (dept !== "All") p.set("department", dept);
    if (branch !== "All") p.set("branch", branch);
    if (category !== "All") p.set("category", category);
    if (ttype !== "All") p.set("type", ttype);
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);
    return p;
  }, [dept, branch, category, ttype, startDate, endDate]);

  const generateReport = useCallback(async () => {
    setError("");
    try {
      const params = buildParams();
      params.set("limit", "30");
      const res = await api.get(`/reports/transactions?${params.toString()}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate report.");
    }
  }, [buildParams]);

  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = () => {
    setDept("All"); setBranch("All"); setCategory("All"); setTtype("All");
    setStartDate("2026-01-01"); setEndDate(new Date().toISOString().slice(0, 10));
  };

  const flash = (msg) => { setExportMsg(msg); setTimeout(() => setExportMsg(""), 3000); };

  const downloadFile = async (path, filename) => {
    try {
      const params = buildParams();
      const res = await api.get(`${path}?${params.toString()}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flash(`${filename} downloaded.`);
    } catch (err) {
      flash("Export failed.");
    }
  };

  const selectStyle = { width: "100%", padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: FONT_UI, background: "#fff" };
  const labelStyle = { fontSize: 11.5, color: C.inkSoft, marginBottom: 5, display: "block", fontFamily: FONT_UI };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 260px", gap: 18 }}>
      <Card style={{ height: "fit-content" }}>
        <SectionTitle><span style={{ display: "flex", alignItems: "center", gap: 6 }}><Filter size={14} /> Filters</span></SectionTitle>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={selectStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={selectStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Department</label>
          <select value={dept} onChange={(e) => setDept(e.target.value)} style={selectStyle}>
            <option>All</option>{meta?.departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Branch</label>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} style={selectStyle}>
            <option>All</option>{meta?.branches.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
            <option>All</option>{meta?.categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Transaction Type</label>
          <select value={ttype} onChange={(e) => setTtype(e.target.value)} style={selectStyle}>
            <option>All</option>{(meta?.types || []).map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={generateReport} style={{ width: "100%", background: C.navy, color: "#fff", border: "none", borderRadius: 6, padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>
          Generate Report
        </button>
        <button onClick={resetFilters} style={{ width: "100%", background: "#fff", color: C.inkSoft, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>
          Reset Filters
        </button>
      </Card>

      <Card>
        <SectionTitle action={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => downloadFile("/reports/export/csv", "BI_Report.csv")} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
              <FileDown size={13} /> CSV
            </button>
            <button onClick={() => downloadFile("/reports/export/excel", "BI_Report.xlsx")} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
              <FileSpreadsheet size={13} /> Excel
            </button>
          </div>
        }>
          Report Preview
        </SectionTitle>
        {exportMsg && <div style={{ background: C.accentSoft, color: C.accent, fontSize: 12.5, padding: "9px 12px", borderRadius: 6, marginBottom: 12 }}>{exportMsg}</div>}
        {error && <ErrorBlock message={error} />}
        {!result && !error && <LoadingBlock label="Loading report…" />}
        {result && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
              <SummaryTile label="Transactions" value={result.summary.count} />
              <SummaryTile label="Sales" value={fmtCompact(result.summary.sales)} color={C.accent} />
              <SummaryTile label="Purchases" value={fmtCompact(result.summary.purchases)} color={C.warn} />
              <SummaryTile label="Net Total" value={fmtCompact(result.summary.total)} />
            </div>
            {result.chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={result.chartData}>
                  <CartesianGrid stroke={C.border} vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 10.5, fill: C.inkSoft }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: C.inkSoft }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={fmtNaira} />} />
                  <Bar dataKey="value" name="Net Amount" fill={C.accent} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div style={{ marginTop: 16, maxHeight: 280, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_UI }}>
                <thead style={{ position: "sticky", top: 0, background: "#fff" }}>
                  <tr style={{ textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
                    {["ID", "Date", "Dept.", "Category", "Type", "Amount"].map((h) => (
                      <th key={h} style={{ padding: "7px 6px", fontSize: 10.5, color: C.inkSoft, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.transactions.map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "7px 6px", fontSize: 11.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{t.id}</td>
                      <td style={{ padding: "7px 6px", fontSize: 11.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{new Date(t.date).toISOString().slice(0, 10)}</td>
                      <td style={{ padding: "7px 6px", fontSize: 12, color: C.ink }}>{t.department}</td>
                      <td style={{ padding: "7px 6px", fontSize: 12, color: C.ink }}>{t.category}</td>
                      <td style={{ padding: "7px 6px", fontSize: 12, color: C.inkSoft }}>{t.type}</td>
                      <td style={{ padding: "7px 6px", fontSize: 12, fontFamily: FONT_MONO, fontWeight: 600, color: C.ink }}>{fmtNaira(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.summary.count > 30 && (
                <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 8 }}>
                  Showing 30 of {result.summary.count} — use CSV or Excel export for the full set.
                </div>
              )}
              {result.summary.count === 0 && (
                <div style={{ fontSize: 12.5, color: C.inkSoft, textAlign: "center", padding: "20px 0" }}>No transactions match these filters.</div>
              )}
            </div>
          </>
        )}
      </Card>

      <Card style={{ height: "fit-content" }}>
        <SectionTitle>Report Summary</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: C.inkSoft, textTransform: "uppercase" }}>Period</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 4 }}>{startDate} → {endDate}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.inkSoft, textTransform: "uppercase" }}>Report Status</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              <CheckCircle2 size={14} color={C.accent} />
              <span style={{ fontSize: 12.5, color: C.accent, fontWeight: 600 }}>{result ? "Generated" : "Not yet generated"}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SummaryTile({ label, value, color }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px" }}>
      <div style={{ fontSize: 10.5, color: C.inkSoft, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, color: color || C.ink, marginTop: 4 }}>{value}</div>
    </div>
  );
}
