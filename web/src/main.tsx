import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from "@txnlab/use-wallet-react";
import { App } from "./App";
import "./styles.css";

// Lute (browser wallet, no WalletConnect relay → fastest connect) + Pera + Defly
// on Algorand testnet. Connecting a wallet is the auth layer; the same wallet
// signs the native ALGO payments — one chain, one signature.
const walletManager = new WalletManager({
  wallets: [
    { id: WalletId.LUTE, options: { siteName: "Tendril" } },
    WalletId.PERA,
    WalletId.DEFLY,
  ],
  defaultNetwork: NetworkId.TESTNET,
});

// Warm up lute-connect so use-wallet's lazy import is already cached when the
// user clicks: Lute opens a popup via window.open, and a cold `await import()`
// inside the click handler loses the user-gesture → the browser blocks the popup
// (the "sometimes it doesn't open" bug). Pre-fetching removes that await.
void import("lute-connect");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WalletProvider>
  </React.StrictMode>,
);
