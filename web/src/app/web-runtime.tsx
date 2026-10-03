"use client";

import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from "@txnlab/use-wallet-react";
import { App } from "../App";
import { CustodialSignProvider } from "../context/CustodialSignContext";
import { network } from "../lib/network";
import "lute-connect";

const walletManager = new WalletManager({
  wallets: [
    { id: WalletId.LUTE, options: { siteName: "Tendril" } },
    WalletId.PERA,
    WalletId.DEFLY,
  ],
  defaultNetwork: network.network === "mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET,
});

export function WebRuntime() {
  return (
    <StrictMode>
      <CustodialSignProvider>
        <WalletProvider manager={walletManager}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WalletProvider>
      </CustodialSignProvider>
    </StrictMode>
  );
}
