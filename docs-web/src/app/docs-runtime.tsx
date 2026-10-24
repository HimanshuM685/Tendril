"use client";

import { StrictMode } from "react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { Docs } from "../components/Docs";

export function DocsRuntime({ initialPath = "/" }: { initialPath?: string }) {
  return (
    <StrictMode>
      {typeof window === "undefined"
        ? <MemoryRouter initialEntries={[initialPath]}><Docs /></MemoryRouter>
        : <BrowserRouter><Docs /></BrowserRouter>}
    </StrictMode>
  );
}
