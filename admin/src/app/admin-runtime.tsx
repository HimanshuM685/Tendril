"use client";

import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { App } from "../App";

export function AdminRuntime() {
  return (
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}
