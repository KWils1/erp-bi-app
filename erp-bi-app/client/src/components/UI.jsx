import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { C, FONT_UI, FONT_MONO } from "../theme";

export function Card({ children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, ...style }}>
      {children}
    </div>
  );
}

export function KpiCard({ label, value, delta, deltaLabel, trend = "up", sub, icon: Icon }) {
  const isUp = trend === "up";
  const trendColor = trend === "flat" ? C.inkSoft : isUp ? C.accent : C.bad;
  return (
    <Card style={{ borderLeft: `3px solid ${trendColor}`, minHeight: 108 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 11.5, color: C.inkSoft, fontFamily: FONT_UI }}>{label}</div>
        {Icon && <Icon size={15} color={C.inkSoft} />}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 600, color: C.ink, lineHeight: 1.1 }}>
        {value}
      </div>
      {(delta !== undefined || sub) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12 }}>
          {delta !== undefined && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, color: trendColor, fontWeight: 600 }}>
              {trend === "up" ? <TrendingUp size={13} /> : trend === "down" ? <TrendingDown size={13} /> : null}
              {delta}
            </span>
          )}
          <span style={{ color: C.inkSoft }}>{deltaLabel || sub}</span>
        </div>
      )}
    </Card>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h3 style={{ fontFamily: FONT_UI, fontSize: 14.5, fontWeight: 600, color: C.ink, margin: 0 }}>{children}</h3>
      {action}
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    healthy: { bg: C.accentSoft, fg: C.accent, label: "Healthy" },
    low: { bg: C.warnSoft, fg: C.warn, label: "Low" },
    critical: { bg: C.badSoft, fg: C.bad, label: "Critical" },
    Delivered: { bg: C.accentSoft, fg: C.accent, label: "Delivered" },
    "In Transit": { bg: C.warnSoft, fg: C.warn, label: "In Transit" },
    "Pending Approval": { bg: "#EEF0F5", fg: C.inkSoft, label: "Pending Approval" },
    Delayed: { bg: C.badSoft, fg: C.bad, label: "Delayed" },
    Active: { bg: C.accentSoft, fg: C.accent, label: "Active" },
    Inactive: { bg: "#EEF0F5", fg: C.inkSoft, label: "Inactive" },
  };
  const s = map[status] || { bg: "#EEE", fg: "#555", label: status };
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontFamily: FONT_UI,
        fontSize: 11.5,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 20,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

export function RolePill({ role }) {
  const map = {
    "System Admin": { bg: "#EDE4FB", fg: "#6B3FA0" },
    Manager: { bg: C.accentSoft, fg: C.accent },
    Analyst: { bg: "#DCEBFA", fg: "#1D5A9C" },
    Viewer: { bg: "#EEF0F5", fg: C.inkSoft },
  };
  const s = map[role] || { bg: "#EEE", fg: "#555" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontFamily: FONT_UI,
        fontSize: 11.5,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 20,
      }}
    >
      {role}
    </span>
  );
}

export const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: C.navy, borderRadius: 6, padding: "10px 13px", fontFamily: FONT_UI }}>
      <div style={{ color: "#9AA1B5", fontSize: 11, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: "#fff", fontSize: 12.5, fontFamily: FONT_MONO, display: "flex", gap: 10, justifyContent: "space-between" }}>
          <span style={{ color: p.color || "#fff", fontFamily: FONT_UI }}>{p.name}</span>
          <span>{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function TextField({ label, icon: Icon, type = "text", value, onChange, placeholder, rightAction }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12.5, fontFamily: FONT_UI, color: C.inkSoft, marginBottom: 5 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {Icon && <Icon size={15} color={C.inkSoft} style={{ position: "absolute", left: 12 }} />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: `10px 12px 10px ${Icon ? 36 : 12}px`,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 13.5,
            fontFamily: FONT_UI,
            color: C.ink,
            background: "#fff",
          }}
        />
        {rightAction && <div style={{ position: "absolute", right: 12 }}>{rightAction}</div>}
      </div>
    </div>
  );
}

export function LoadingBlock({ label = "Loading…" }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: C.inkSoft, fontFamily: FONT_UI, fontSize: 13 }}>
      {label}
    </div>
  );
}

export function ErrorBlock({ message }) {
  return (
    <div
      style={{
        background: C.badSoft,
        color: C.bad,
        fontSize: 12.5,
        padding: "12px 14px",
        borderRadius: 6,
        fontFamily: FONT_UI,
      }}
    >
      {message}
    </div>
  );
}
