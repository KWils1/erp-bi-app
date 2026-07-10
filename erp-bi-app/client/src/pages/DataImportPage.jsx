import React, { useEffect, useState, useCallback } from "react";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import api from "../api/client";
import { Card, SectionTitle, StatusPill, LoadingBlock, ErrorBlock } from "../components/UI";
import { C, FONT_UI, FONT_MONO } from "../theme";

export default function DataImportPage() {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const loadHistory = useCallback(() => {
    api
      .get("/imports/history")
      .then((res) => setHistory(res.data.history))
      .catch((err) => setError(err.response?.data?.error || "Failed to load import history."));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFiles = async (fileList) => {
    const file = fileList[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/imports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadMsg(`Imported ${res.data.inserted} rows${res.data.skipped ? ` (${res.data.skipped} skipped — check formatting)` : ""}.`);
      loadHistory();
    } catch (err) {
      setUploadMsg(err.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionTitle>Import ERP Data</SectionTitle>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          style={{
            border: `2px dashed ${dragOver ? C.accent : C.border}`,
            borderRadius: 8,
            padding: "40px 20px",
            textAlign: "center",
            background: dragOver ? C.accentSoft : "#fafafa",
            transition: "all 0.15s",
          }}
        >
          <UploadCloud size={32} color={C.accent} style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
            {uploading ? "Uploading…" : "Drag & drop a file here"}
          </div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 16 }}>
            Supports CSV and Excel (.xlsx). Expected columns: date, department, branch, category, type, amount.
          </div>
          <label style={{ display: "inline-block", background: C.navy, color: "#fff", padding: "9px 18px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
            Browse Files
            <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
          </label>
        </div>
        {uploadMsg && (
          <div style={{ marginTop: 14 }}>
            <div style={{ background: C.accentSoft, color: C.accent, fontSize: 12.5, padding: "9px 12px", borderRadius: 6, fontFamily: FONT_UI }}>
              {uploadMsg}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Import History</SectionTitle>
        {error && <ErrorBlock message={error} />}
        {!history && !error && <LoadingBlock label="Loading history…" />}
        {history && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_UI }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
                {["File Name", "Rows Processed", "Date", "Imported By", "Status"].map((h) => (
                  <th key={h} style={{ padding: "8px 6px", fontSize: 11, color: C.inkSoft, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((f) => (
                <tr key={f.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 6px", fontSize: 13, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
                    <FileSpreadsheet size={13} color={C.inkSoft} /> {f.file_name}
                  </td>
                  <td style={{ padding: "10px 6px", fontSize: 12.5, fontFamily: FONT_MONO, color: C.inkSoft }}>{f.rows_count}</td>
                  <td style={{ padding: "10px 6px", fontSize: 12.5, fontFamily: FONT_MONO, color: C.inkSoft }}>
                    {new Date(f.created_at).toISOString().slice(0, 10)}
                  </td>
                  <td style={{ padding: "10px 6px", fontSize: 12.5, color: C.inkSoft }}>{f.imported_by || "—"}</td>
                  <td style={{ padding: "10px 6px" }}><StatusPill status="healthy" /></td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "20px 6px", textAlign: "center", color: C.inkSoft, fontSize: 12.5 }}>No imports yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
