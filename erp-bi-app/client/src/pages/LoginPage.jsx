import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { TextField, ErrorBlock } from "../components/UI";
import { C, FONT_UI } from "../theme";

const DEMO_ACCOUNTS = [
  { email: "admin@lautech-erp.edu.ng", password: "Admin@123", role: "System Admin" },
  { email: "manager@lautech-erp.edu.ng", password: "Manager@123", role: "Manager" },
  { email: "analyst@lautech-erp.edu.ng", password: "Analyst@123", role: "Analyst" },
  { email: "bisi.yusuf@lautech-erp.edu.ng", password: "Viewer@123", role: "Viewer" },
];

export default function LoginPage() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate("/dashboard");
  };

  const fillDemo = (acct) => {
    setEmail(acct.email);
    setPassword(acct.password);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_UI }}>
      <div style={{ width: 420, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <BarChart3 size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>Automated BI Reporting Tool</h1>
          <div style={{ fontSize: 12.5, color: C.inkSoft }}>Enterprise Resource Planning (ERP)</div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Sign In</div>
          <form onSubmit={handleSubmit}>
            <TextField label="Email" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            <TextField
              label="Password"
              icon={Lock}
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              rightAction={
                <button type="button" onClick={() => setShowPw((s) => !s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {showPw ? <EyeOff size={15} color={C.inkSoft} /> : <Eye size={15} color={C.inkSoft} />}
                </button>
              }
            />
            {error && (
              <div style={{ marginBottom: 14 }}>
                <ErrorBlock message={error} />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", background: C.navy, color: "#fff", border: "none", borderRadius: 6, padding: "11px 0", fontSize: 13.5, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11.5, color: C.inkSoft, marginBottom: 8, fontWeight: 600 }}>DEMO ACCOUNTS (seeded)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => fillDemo(a)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ fontSize: 12, color: C.ink }}>{a.email}</span>
                <span style={{ fontSize: 11, color: C.inkSoft }}>{a.role}</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 8 }}>
            Click an account to autofill, then Sign In. These are real rows created by the seed script — passwords are hashed with bcrypt in the database.
          </div>
        </div>
      </div>
    </div>
  );
}
