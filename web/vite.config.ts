import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// algosdk expects a few Node globals (Buffer, etc.) in the browser; nodePolyfills
// provides them. @tendril/shared is aliased to its TS source so Vite transpiles
// it without a separate build step.
export default defineConfig({
  plugins: [react(), nodePolyfills({ globals: { Buffer: true, global: true, process: true } })],
  resolve: {
    alias: {
      "@tendril/shared": resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [resolve(__dirname, "..")] },
  },
});
