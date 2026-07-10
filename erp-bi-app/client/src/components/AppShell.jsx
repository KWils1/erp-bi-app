import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Wallet, TrendingUp, UploadCloud,
  FileText, Users, Settings, LogOut, BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { RolePill } from "./UI";
import { C, FONT_UI, FONT_MONO } from "../theme";

const NAV_SECTIONS = [
  { section: "Overview", items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    section: "Modules",
    items: [
      { to: "/sales", label: "Sales", icon: TrendingUp },
      { to: "/inventory", label: "Inventory", icon: Package },
      { to: "/procurement", label: "Procurement", icon: ShoppingCart },
      { to: "/finance", label: "Finance", icon: Wallet },
    ],
  },
  {
    section: "Reporting",
    items: [
      { to: "/import", label: "Data Import", icon: UploadCloud },
      { to: "/reports", label: "Report Generation", icon: FileText },
    ],
  },
  {
    section: "Administration",
    items: [
      { to: "/users", label: "User Management", icon: Users, adminOnly: true },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FONT_UI }}>
      <div style={{ width: 236, background: C.navy, color: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={18} />
            <div style={{ fontFamily: FONT_MONO, fontSize: 13.5, fontWeight: 700, letterSpacing: 0.5 }}>ERP BI</div>
          </div>
          <div style={{ fontSize: 10.5, color: "#9AA1B5", marginTop: 3 }}>Reporting &amp; Analytics</div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {NAV_SECTIONS.map((sec) => {
            const items = sec.items.filter((i) => !i.adminOnly || user?.role === "System Admin");
            if (items.length === 0) return null;
            return (
              <div key={sec.section} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#6B7286", textTransform: "uppercase", letterSpacing: 0.6, padding: "0 12px 6px" }}>
                  {sec.section}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        style={({ isActive }) => ({
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          background: isActive ? "rgba(15,110,103,0.25)" : "transparent",
                          border: "none",
                          borderRadius: 6,
                          color: isActive ? "#fff" : "#9AA1B5",
                          fontFamily: FONT_UI,
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                          textDecoration: "none",
                          borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                        })}
                      >
                        <Icon size={15} />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "12px 20px 18px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
              {user?.name?.split(" ").map((n) => n[0]).join("")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: "#9AA1B5" }}>{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#9AA1B5", fontSize: 12.5, cursor: "pointer", padding: 0 }}
          >
            <LogOut size={13} /> Log Out
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "14px 26px", borderBottom: `1px solid ${C.border}`, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11.5, fontFamily: FONT_MONO, color: C.inkSoft }}>FY 2026</span>
            <RolePill role={user?.role} />
          </div>
        </div>
        <div style={{ padding: 26, flex: 1, overflowY: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
