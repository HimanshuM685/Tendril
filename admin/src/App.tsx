import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { loadToken, storeToken } from "./lib/api";
import { AdminLayout } from "./components/AdminLayout";
import { Dashboard } from "./pages/Dashboard";
import { GasRequests } from "./pages/GasRequests";
import { GoogleCallback } from "./pages/GoogleCallback";
import { Login } from "./pages/Login";
import { Treasury } from "./pages/Treasury";
import { Users } from "./pages/Users";

interface AdminAuth {
  token: string | null;
  email: string | null;
  setSession: (token: string, email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AdminAuth | null>(null);

export function useAdminAuth(): AdminAuth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth outside provider");
  return ctx;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAdminAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  const [token, setToken] = useState<string | null>(() => loadToken());
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const setSession = useCallback((t: string, e: string) => {
    storeToken(t);
    setToken(t);
    setEmail(e);
  }, []);

  const signOut = useCallback(() => {
    storeToken(null);
    setToken(null);
    setEmail(null);
    navigate("/login");
  }, [navigate]);

  const auth = useMemo(
    () => ({ token, email, setSession, signOut }),
    [token, email, setSession, signOut],
  );

  useEffect(() => {
    if (!token) setEmail(null);
  }, [token]);

  return (
    <AuthContext.Provider value={auth}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/google" element={<GoogleCallback />} />
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="gas-requests" element={<GasRequests />} />
          <Route path="users" element={<Users />} />
          <Route path="treasury" element={<Treasury />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
