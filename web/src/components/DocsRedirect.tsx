import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { legacyDocsUrl } from "../lib/docsLinks";

/** Client fallback for static hosts that do not apply web/vercel.json redirects. */
export function DocsRedirect() {
  const { pathname, search, hash } = useLocation();
  const href = legacyDocsUrl(pathname, search, hash);
  useEffect(() => { window.location.replace(href); }, [href]);
  return <p>Opening documentation… <a href={href}>Continue to Tendril Docs</a></p>;
}
