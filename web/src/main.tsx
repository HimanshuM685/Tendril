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
import { network } from "./lib/network";
import "./styles.css";
// Eager load — use-wallet dynamically imports this on connect; without it cached
// the await loses the click user-gesture and Lute's popup gets blocked.
import "lute-connect";

// Lute (browser wallet, no WalletConnect relay → fastest connect) + Pera + Defly.
// Connecting a wallet is the auth layer; the same wallet signs x402 payments.
// The network comes from VITE_ALGORAND_NETWORK so the wallet can't end up on a
// different chain than the one the registry quotes prices on.
const walletManager = new WalletManager({
  wallets: [
    { id: WalletId.LUTE, options: { siteName: "Tendril" } },
    WalletId.PERA,
    WalletId.DEFLY,
  ],
  defaultNetwork: network.network === "mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WalletProvider>
  </React.StrictMode>,
);
