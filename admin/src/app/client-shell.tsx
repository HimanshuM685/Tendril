"use client";

import dynamic from "next/dynamic";

const AdminRuntime = dynamic(
  () => import("./admin-runtime").then((module) => module.AdminRuntime),
  {
    ssr: false,
    loading: () => <div className="login-page"><p className="kicker">Loading admin…</p></div>,
  },
);

export function ClientShell() {
  return <AdminRuntime />;
}
