"use client";

import { WebRuntime } from "./web-runtime";

export function ClientShell({ initialPath = "/" }: { initialPath?: string }) {
  return <WebRuntime initialPath={initialPath} />;
}
