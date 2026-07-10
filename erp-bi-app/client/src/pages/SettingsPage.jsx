import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { Card, SectionTitle, RolePill, LoadingBlock, ErrorBlock } from "../components/UI";
import { C } from "../theme";

export default function SettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [security, setSecurity] = useState(null);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    api.get("/settings/account").then((res) => setPrefs(res.data.preferences)).catch((err) => setError(err.response?.data?.error || "Failed to load settings."));
    api.get("/settings/security").then((res) => setSecurity(res.data)).catch(() => {});
  }, []);

  const updatePref = async (key, value) => {
    const body = {};
    if (key === "email_scheduled_reports") body.emailScheduledReports = value;
    if (key === "low_stock_alerts") body.lowStockAlerts = value;
    if (key === "weekly_digest") body.weeklyDigest = value;
    try {
      const res = await api.patch("/settings/preferences", body);
      setPrefs(res.data.preferences);
      setSavedMsg("Preferences saved.");
      setTimeout(() => setSavedMsg(""), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save preference.");
    }
  };

  if (error) return <ErrorBlock message={error} />;
  if (!prefs) return <LoadingBlock label="Loading settings…" />;

  const prefItems = [
    { key: "email_scheduled_reports", label: "Email notifications for scheduled reports" },
    { key: "low_stock_alerts", label: "Low-stock alert threshold notifications" },
    { key: "weekly_digest", label: "Weekly executive summary digest" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionTitle>Account</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>
            {user?.name?.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{user?.name}</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft }}>{user?.email}</div>
          </div>
          <div style={{ marginLeft: "auto" }}><RolePill role={user?.role} /></div>
        </div>
      </Card>

      <Card>
        <SectionTitle>System Preferences</SectionTitle>
        {savedMsg && <div style={{ background: C.accentSoft, color: C.accent, fontSize: 12, padding: "6px 10px", borderRadius: 6, marginBottom: 12, display: "inline-block" }}>{savedMsg}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {prefItems.map((item) => (
            <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.ink, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!prefs[item.key]}
                onChange={(e) => updatePref(item.key, e.target.checked)}
              />
              {item.label}
            </label>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.inkSoft }}>
            <input type="checkbox" disabled />
            Dark mode (coming soon)
          </label>
        </div>
      </Card>

      <Card>
        <SectionTitle>Data &amp; Security</SectionTitle>
        {!security ? (
          <div style={{ fontSize: 12.5, color: C.inkSoft }}>Loading security status…</div>
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.7, marginBottom: 14 }}>
              Role-based access control is {security.rbacEnabled ? "active" : "disabled"}. System Admins can manage
              users and modify system settings. Managers and Analysts have read/report access scoped to their
              department; Viewers have read-only access. Report exports are {security.auditExportLogging ? "logged for audit purposes" : "not currently logged"}.
              Low-stock alerts trigger when stock falls below {security.lowStockThresholdPct}% of the reorder level.
            </div>
            {security.recentActivity?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: C.inkSoft, textTransform: "uppercase", marginBottom: 8 }}>Recent Audit Activity</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {security.recentActivity.map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.ink }}>
                      <span>{a.action.replace(/_/g, " ")} — {a.user_name || "Unknown user"}</span>
                      <span style={{ color: C.inkSoft }}>{new Date(a.created_at).toISOString().slice(0, 16).replace("T", " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
