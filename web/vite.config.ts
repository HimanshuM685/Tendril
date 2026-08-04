import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const require = createRequire(import.meta.url);
const resolvePkg = (name: string) => dirname(require.resolve(name));

// algosdk expects a few Node globals (Buffer, etc.) in the browser; nodePolyfills
// provides them. @tendril/shared is aliased to its TS source so Vite transpiles
// it without a separate build step.
export default defineConfig({
  plugins: [react(), nodePolyfills({ globals: { Buffer: true, global: true, process: true } })],
  resolve: {
    alias: {
      "@tendril/shared": resolve(__dirname, "../shared/src/index.ts"),
      // use-wallet nests magic-sdk@29; resolve web's hoisted v33 instead.
      "magic-sdk": resolvePkg("magic-sdk"),
      "@magic-ext/algorand": resolvePkg("@magic-ext/algorand"),
      "@magic-ext/oauth2": resolvePkg("@magic-ext/oauth2"),
      "@magic-sdk/provider": resolvePkg("@magic-sdk/provider"),
    },
    dedupe: ["magic-sdk", "@magic-ext/algorand", "@magic-ext/oauth2", "@magic-sdk/provider"],
  },
  server: {
    port: 5173,
    fs: { allow: [resolve(__dirname, "..")] },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the big, rarely-changing vendors out of the app chunk so an app
        // edit doesn't re-download algosdk (~1MB) — browsers keep the cached copy.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("algosdk")) return "algosdk";
          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return "react";
          return undefined;
        },
      },
    },
  },
});
