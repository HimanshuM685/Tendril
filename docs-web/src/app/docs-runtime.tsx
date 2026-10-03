"use client";

import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { Docs } from "../components/Docs";

export function DocsRuntime() {
  return (
    <StrictMode>
      <BrowserRouter>
        <Docs />
      </BrowserRouter>
    </StrictMode>
  );
}
