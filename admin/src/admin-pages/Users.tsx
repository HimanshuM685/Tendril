import { useEffect, useState } from "react";
import { useAdminAuth } from "../App";
import { explorerAddrUrl, fetchAdminUsers, type AdminUserRow } from "../lib/api";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString();
}

export function Users() {
  const { token } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    if (!token) return;
    setErr(null);
    fetchAdminUsers(token, offset)
      .then((r) => {
        setUsers(r.users);
        setTotal(r.total);
      })
      .catch((e: Error) => setErr(e.message));
  }, [token, offset]);

  return (
    <>
      <header className="admin-header">
        <h1>Users</h1>
        <p className="kicker muted">
          Google custodial accounts · {total} total
        </p>
      </header>

      {err && <p className="error">{err}</p>}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Created</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name ?? "—"}</td>
                <td>{u.email}</td>
                <td className="addr">
                  <a href={explorerAddrUrl(u.address)} target="_blank" rel="noreferrer">
                    {u.address}
                  </a>
                </td>
                <td className="small">{fmtDate(u.createdAt)}</td>
                <td className="small">{fmtDate(u.lastLoginAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button
          type="button"
          className="btn"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn"
          disabled={offset + limit >= total}
          onClick={() => setOffset(offset + limit)}
        >
          Next
        </button>
      </div>
    </>
  );
}
