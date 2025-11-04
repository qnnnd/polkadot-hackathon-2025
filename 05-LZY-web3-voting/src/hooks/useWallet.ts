"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";

/**
 * Unified wallet hook for both EVM (Moonbeam) and Substrate (Bifrost) chains
 */
export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Connect to wallet using the first available connector
   */
  const connectWallet = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    disconnect();
  };

  // Return loading state until mounted on client
  if (!mounted) {
    return {
      address: undefined,
      isConnected: false,
      chain: undefined,
      connectors: [],
      isPending: false,
      connectWallet: () => {
        // No-op until mounted
      },
      disconnectWallet: () => {
        // No-op until mounted
      },
      connect,
      disconnect,
    };
  }

  return {
    address,
    isConnected,
    chain,
    connectors,
    isPending,
    connectWallet,
    disconnectWallet,
    connect,
    disconnect,
  };
}
