export const DOCS_ORIGIN = "https://docs.tendrilhq.com";

export function docsUrl(path = ""): string {
  // Home links and legacy /docs URLs go directly to the subdomain root.
  const destination = path.replace(/^\/docs\/?(?=[?#]|$)/, "");
  return `${DOCS_ORIGIN}${destination}`;
}

export function legacyDocsUrl(pathname: string, search: string, hash: string): string {
  return docsUrl(`${pathname === "/api" ? "/docs/api" : pathname}${search}${hash}`);
}
