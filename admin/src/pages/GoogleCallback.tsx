import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeAdminCode } from "../lib/api";
import { useAdminAuth } from "../App";

export function GoogleCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAdminAuth();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const oauthErr = params.get("error");
    if (oauthErr) {
      setErr(oauthErr);
      return;
    }

    const code = params.get("code");
    if (!code) {
      setErr("missing exchange code");
      return;
    }

    exchangeAdminCode(code)
      .then((s) => {
        setSession(s.token, s.email);
        navigate("/", { replace: true });
      })
      .catch((e: Error) => setErr(e.message));
  }, [params, setSession, navigate]);

  if (err) {
    return (
      <div className="login-page">
        <div className="login-card panel">
          <p className="display">Sign-in failed</p>
          <p className="error">{err}</p>
          <a className="btn" href="/login" style={{ marginTop: 16 }}>
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <p className="kicker">Completing sign-in…</p>
    </div>
  );
}
