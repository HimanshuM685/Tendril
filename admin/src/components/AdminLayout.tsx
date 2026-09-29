import { NavLink, Outlet } from "react-router-dom";
import { useAdminAuth } from "../App";

const LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/gas-requests", label: "Gas requests", end: false },
  { to: "/users", label: "Users", end: false },
  { to: "/treasury", label: "Treasury", end: false },
  { to: "/settings", label: "Settings", end: false },
];

export function AdminLayout() {
  const { email, signOut } = useAdminAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-mark" aria-hidden="true">
            T
          </span>
          Tendril
        </div>
        <nav className="admin-nav">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-user">
          {email && <p>{email}</p>}
          <button type="button" className="btn" onClick={signOut}>
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
