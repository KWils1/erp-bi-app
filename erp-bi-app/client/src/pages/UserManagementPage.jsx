import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, ShieldCheck, X } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, KpiCard, SectionTitle, RolePill, StatusPill, TextField, LoadingBlock, ErrorBlock } from "../components/UI";
import { C, fmtNum, FONT_UI } from "../theme";

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "System Admin";

  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Viewer", department: "Sales" });
  const [createdMsg, setCreatedMsg] = useState("");

  const loadUsers = useCallback(() => {
    api.get("/users").then((res) => setUsers(res.data.users)).catch((err) => setError(err.response?.data?.error || "Failed to load users."));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = (users || []).filter((u) => {
    if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "All" && u.role !== roleFilter) return false;
    if (statusFilter !== "All" && u.status !== statusFilter) return false;
    return true;
  });

  const toggleStatus = async (u) => {
    if (!isAdmin) return;
    const newStatus = u.status === "Active" ? "Inactive" : "Active";
    try {
      await api.patch(`/users/${u.id}/status`, { status: newStatus });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status.");
    }
  };

  const removeUser = async (u) => {
    if (!isAdmin) return;
    if (!window.confirm(`Remove ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove user.");
    }
  };

  const addUser = async () => {
    if (!newUser.name || !newUser.email) return;
    try {
      const res = await api.post("/users", newUser);
      setCreatedMsg(`User created. Temporary password: ${res.data.temporaryPassword} — share this securely and ask them to change it on first login.`);
      setNewUser({ name: "", email: "", role: "Viewer", department: "Sales" });
      setShowAddModal(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create user.");
    }
  };

  if (error) return <ErrorBlock message={error} />;
  if (!users) return <LoadingBlock label="Loading users…" />;

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "Active").length,
    admins: users.filter((u) => u.role === "System Admin").length,
    inactive: users.filter((u) => u.status === "Inactive").length,
  };
  const selectStyle = { padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: FONT_UI, background: "#fff" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {!isAdmin && (
        <div style={{ background: C.warnSoft, color: C.warn, fontSize: 12.5, padding: "10px 14px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={15} /> You're viewing in read-only mode. Only System Admin accounts can manage users.
        </div>
      )}
      {createdMsg && (
        <div style={{ background: C.accentSoft, color: C.accent, fontSize: 12.5, padding: "10px 14px", borderRadius: 6 }}>{createdMsg}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <KpiCard label="Total Users" value={fmtNum(stats.total)} sub="registered accounts" trend="flat" />
        <KpiCard label="Active Accounts" value={fmtNum(stats.active)} sub="currently enabled" trend="up" />
        <KpiCard label="System Admins" value={fmtNum(stats.admins)} sub="full access" trend="flat" />
        <KpiCard label="Inactive Accounts" value={fmtNum(stats.inactive)} sub="disabled" trend="down" />
      </div>

      <Card>
        <SectionTitle action={isAdmin && (
          <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.navy, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
            <Plus size={13} /> Add New User
          </button>
        )}>
          User Directory
        </SectionTitle>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} color={C.inkSoft} style={{ position: "absolute", left: 10, top: 10 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" style={{ width: "100%", padding: "8px 10px 8px 32px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }} />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle}>
            <option>All</option><option>System Admin</option><option>Manager</option><option>Analyst</option><option>Viewer</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option>All</option><option>Active</option><option>Inactive</option>
          </select>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_UI }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
              {["Name", "Email", "Role", "Department", "Status", "Last Login", isAdmin && "Actions"].filter(Boolean).map((h) => (
                <th key={h} style={{ padding: "9px 6px", fontSize: 11, color: C.inkSoft, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "9px 6px", fontSize: 12.5, color: C.ink, fontWeight: 500 }}>{u.name}</td>
                <td style={{ padding: "9px 6px", fontSize: 12, color: C.inkSoft }}>{u.email}</td>
                <td style={{ padding: "9px 6px" }}><RolePill role={u.role} /></td>
                <td style={{ padding: "9px 6px", fontSize: 12, color: C.inkSoft }}>{u.department || "—"}</td>
                <td style={{ padding: "9px 6px" }}>
                  <span onClick={() => toggleStatus(u)} style={{ cursor: isAdmin ? "pointer" : "default" }}>
                    <StatusPill status={u.status} />
                  </span>
                </td>
                <td style={{ padding: "9px 6px", fontSize: 11.5, color: C.inkSoft }}>{u.last_login ? new Date(u.last_login).toISOString().slice(0, 10) : "—"}</td>
                {isAdmin && (
                  <td style={{ padding: "9px 6px" }}>
                    <button onClick={() => removeUser(u)} style={{ background: "none", border: "none", color: C.bad, fontSize: 12, cursor: "pointer" }}>Remove</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12.5, color: C.inkSoft }}>No users match these filters.</div>}
      </Card>

      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(21,26,45,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>Add New User</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <TextField label="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            <TextField label="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12.5, color: C.inkSoft, marginBottom: 6 }}>Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ ...selectStyle, width: "100%" }}>
                <option>System Admin</option><option>Manager</option><option>Analyst</option><option>Viewer</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12.5, color: C.inkSoft, marginBottom: 6 }}>Department</label>
              <select value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} style={{ ...selectStyle, width: "100%" }}>
                {["Sales", "Finance", "Procurement", "Inventory", "Operations"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <button onClick={addUser} style={{ width: "100%", background: C.navy, color: "#fff", border: "none", borderRadius: 6, padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Create User
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
