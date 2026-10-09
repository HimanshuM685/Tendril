"use client";

import dynamic from "next/dynamic";

const WebRuntime = dynamic(
  () => import("./web-runtime").then((module) => module.WebRuntime),
  {
    ssr: false,
    loading: () => <div className="app-loading" aria-live="polite">Loading Tendril…</div>,
  },
);

export function ClientShell() {
  return <WebRuntime />;
}
