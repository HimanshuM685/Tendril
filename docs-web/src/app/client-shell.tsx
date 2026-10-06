"use client";

import dynamic from "next/dynamic";

const DocsRuntime = dynamic(
  () => import("./docs-runtime").then((module) => module.DocsRuntime),
  {
    ssr: false,
    loading: () => <div className="docs-page-wrapper" aria-live="polite">Loading documentation…</div>,
  },
);

export function ClientShell() {
  return <DocsRuntime />;
}
