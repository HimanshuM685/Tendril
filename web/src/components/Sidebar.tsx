import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import type { WalletSummary } from "@tendril/shared";
import type { Session } from "../App";
import { network } from "../lib/network";

interface SidebarProps {
  session: Session | null;
  activeAddress: string | null;
  wallet: WalletSummary | null;
  activeLeaseCount: number;
  onConnectWallet: () => void;
  onOpenTopUp: () => void;
  onOpenMcp: () => void;
  onSignOut: () => void;
}

function shortAddr(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
}

export function Sidebar({
  session,
  activeAddress,
  wallet,
  activeLeaseCount,
  onConnectWallet,
  onOpenTopUp,
  onOpenMcp,
  onSignOut,
}: SidebarProps) {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const balanceAtomic = wallet?.balanceAtomic ?? 0;
  const balanceDisplay = wallet ? (balanceAtomic / 1_000_000).toFixed(2) : "0.00";
  const fundedHours = Math.round(Number(balanceDisplay) / 0.24);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item ${isActive ? "active" : ""}`;

  // Avatar initials from real session or address
  const initials = session?.name
    ? session.name.slice(0, 2).toUpperCase()
    : activeAddress
      ? activeAddress.slice(0, 2).toUpperCase()
      : "--";

  const displayAddress = activeAddress ? shortAddr(activeAddress) : "";

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
        <span className="brand-flower">
          <svg viewBox="0 0 32 32" width="24" height="24">
            <rect width="32" height="32" rx="6" fill="#0B5D3A" />
            <g fill="#F4F1EA">
              <rect x="5" y="7" width="22" height="4" />
              <rect x="5" y="7" width="2" height="3" />
              <rect x="25" y="7" width="2" height="3" />
              <rect x="14" y="7" width="4" height="17" />
              <rect x="10" y="22" width="12" height="3" />
            </g>
          </svg>
        </span>
        <span className="brand-text">Tendril</span>
      </div>

      {/* Primary Navigation */}
      <nav className="sidebar-nav">
        <NavLink to="/explore" className={navClass}>
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className="nav-label">Explore</span>
        </NavLink>

        <NavLink to="/contribute" className={navClass}>
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span className="nav-label">Contribute</span>
        </NavLink>

        <NavLink to="/dashboard" className={navClass}>
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          </span>
          <span className="nav-label">Dashboard</span>
        </NavLink>

        <NavLink to="/metrics" className={navClass}>
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </span>
          <span className="nav-label">Metrics</span>
        </NavLink>
      </nav>

      {/* Prepaid Balance Widget */}
      <div className="sidebar-balance-widget" onClick={onOpenTopUp} role="button" tabIndex={0} title="Click to Top Up">
        <div className="sb-label">PREPAID BALANCE</div>
        <div className="sb-row">
          <span className="sb-amount">{balanceDisplay} USDC</span>
          <span className="sb-funds">{fundedHours > 0 ? `Funds ~${fundedHours}h` : "No funds"}</span>
        </div>
      </div>

      {/* Secondary Bottom Links with Vector SVG Icons */}
      <div className="sidebar-secondary">
        <button type="button" className="sec-item" onClick={onOpenMcp}>
          <span className="sec-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          <span>Connect MCP</span>
        </button>


        <NavLink to="/docs" className="sec-item">
          <span className="sec-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span>CLI &amp; Docs</span>
        </NavLink>
      </div>

      {/* User / Wallet Profile at Bottom */}
      <div className="sidebar-user-wrap">
        {activeAddress ? (
          <div className="sidebar-user" onClick={() => setUserMenuOpen((v) => !v)} role="button" tabIndex={0}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-addr">{displayAddress}</div>
              <div className="user-sub">
                {session?.authType === "google" ? "Google Custodial" : `Algorand ${network.network}`}
              </div>
            </div>
          </div>
        ) : (
          <button className="sidebar-connect-btn" onClick={onConnectWallet}>
            <div className="user-avatar user-avatar-connect">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
              </svg>
            </div>
            <div className="user-info">
              <div className="user-addr">Connect Wallet</div>
              <div className="user-sub">Pera / Defly / Google</div>
            </div>
          </button>
        )}

        {userMenuOpen && activeAddress && (
          <div className="sidebar-user-menu">
            <div className="sum-head">
              <span className="muted small">Connected Wallet</span>
              <strong className="sum-addr" title={activeAddress}>{shortAddr(activeAddress)}</strong>
            </div>
            <button className="sum-item" onClick={() => { setUserMenuOpen(false); onOpenTopUp(); }}>
              + Top Up USDC
            </button>
            <button className="sum-item" onClick={() => { setUserMenuOpen(false); navigate("/dashboard"); }}>
              View History
            </button>
            <button className="sum-item sum-danger" onClick={() => { setUserMenuOpen(false); onSignOut(); }}>
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
