/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REGISTRY_URL?: string;
  readonly VITE_EXPLORER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
