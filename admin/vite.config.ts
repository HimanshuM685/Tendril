import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@tendril/shared": resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  server: {
    port: 5174,
    fs: { allow: [resolve(__dirname, "..")] },
  },
});
