export const APP_ORIGIN = "https://tendrilhq.com";
export const DOCS_ORIGIN = "https://docs.tendrilhq.com";
export const REGISTRY_URL = (
  (import.meta.env.VITE_REGISTRY_URL as string | undefined) ?? "https://tendrilregister.007575.xyz"
).replace(/\/+$/, "");
