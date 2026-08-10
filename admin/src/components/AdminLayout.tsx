import { NavLink, Outlet } from "react-router-dom";
import { useAdminAuth } from "../App";

export function AdminLayout() {
  const { email, signOut } = useAdminAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="display">Tendril</p>
        <p className="kicker muted">Admin</p>
        <nav className="admin-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/gas-requests">Gas requests</NavLink>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/treasury">Treasury</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          {email && <p className="small muted">{email}</p>}
          <button type="button" className="btn" onClick={signOut} style={{ marginTop: 12 }}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
