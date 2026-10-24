"use client";

import { DocsRuntime } from "./docs-runtime";

export function ClientShell({ initialPath = "/" }: { initialPath?: string }) {
  return <DocsRuntime initialPath={initialPath} />;
}
