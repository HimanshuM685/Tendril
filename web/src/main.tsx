import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
  type SupportedWallet,
} from "@txnlab/use-wallet-react";
import { App } from "./App";
import { isMagicEnabled, MAGIC_ICON } from "./lib/magicConfig";
import { network } from "./lib/network";
import "./styles.css";

async function bootstrap() {
  // Lute (browser wallet, no WalletConnect relay → fastest connect) + Pera + Defly.
  // Connecting a wallet is the auth layer; the same wallet signs x402 payments.
  const wallets: SupportedWallet[] = [
    { id: WalletId.LUTE, options: { siteName: "Tendril" } },
    WalletId.PERA,
    WalletId.DEFLY,
  ];

  // Magic loads only when configured — keeps magic-sdk out of the graph otherwise.
  if (isMagicEnabled) {
    const { createMagicWalletProvider } = await import("./lib/magicWalletProvider");
    wallets.push({
      id: WalletId.CUSTOM,
      options: { provider: createMagicWalletProvider() },
      metadata: { name: "Magic", icon: MAGIC_ICON },
    });
  }

  const walletManager = new WalletManager({
    wallets,
    defaultNetwork: network.network === "mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET,
  });

  // Warm up lute-connect so use-wallet's lazy import is already cached when the
  // user clicks: Lute opens a popup via window.open, and a cold `await import()`
  // inside the click handler loses the user-gesture → the browser blocks the popup.
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
}

void bootstrap();
