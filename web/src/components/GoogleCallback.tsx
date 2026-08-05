import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeGoogleCode } from "../lib/custodialClient";
import type { Session } from "../App";

interface Props {
  onSession: (s: Session) => void;
}

export function GoogleCallback({ onSession }: Props) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const error = params.get("error");
    if (error) {
      setErr(error);
      return;
    }
    const code = params.get("code");
    if (!code) {
      setErr("missing authorization code");
      return;
    }
    void (async () => {
      try {
        const res = await exchangeGoogleCode(code);
        onSession({
          token: res.token,
          address: res.address,
          authType: "google",
          email: res.email,
          name: res.name,
        });
        navigate("/explore", { replace: true });
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, [params, onSession, navigate]);

  if (err) {
    return (
      <section className="page">
        <p className="error">Google sign-in failed: {err}</p>
        <button className="btn" onClick={() => navigate("/explore")}>
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="page">
      <p className="muted">Finishing Google sign-in…</p>
    </section>
  );
}
