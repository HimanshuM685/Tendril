"use client";

import { StrictMode } from "react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from "@txnlab/use-wallet-react";
import { App } from "../App";
import { CustodialSignProvider } from "../context/CustodialSignContext";
import { network } from "../lib/network";

const walletManager = new WalletManager({
  wallets: [
    { id: WalletId.LUTE, options: { siteName: "Tendril" } },
    WalletId.PERA,
    WalletId.DEFLY,
  ],
  defaultNetwork: network.network === "mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET,
});

export function WebRuntime({ initialPath = "/" }: { initialPath?: string }) {
  return (
    <StrictMode>
      <CustodialSignProvider>
        <WalletProvider manager={walletManager}>
          {typeof window === "undefined"
            ? <MemoryRouter initialEntries={[initialPath]}><App /></MemoryRouter>
            : <BrowserRouter><App /></BrowserRouter>}
        </WalletProvider>
      </CustodialSignProvider>
    </StrictMode>
  );
}
