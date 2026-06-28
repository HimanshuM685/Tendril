import React from "react";
import ReactDOM from "react-dom/client";
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from "@txnlab/use-wallet-react";
import { App } from "./App";
import "./styles.css";

// Pera + Defly on Algorand testnet. Connecting a wallet is the auth layer;
// the same wallet signs the native ALGO payments — one chain, one signature.
const walletManager = new WalletManager({
  wallets: [WalletId.PERA, WalletId.DEFLY],
  defaultNetwork: NetworkId.TESTNET,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager}>
      <App />
    </WalletProvider>
  </React.StrictMode>,
);
