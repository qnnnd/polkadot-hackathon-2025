"use client";

import { useCallback, useState } from "react";

interface UseDemoWalletOptions {
  onConnect?: (address: string) => Promise<void> | void;
  onDisconnect?: () => void;
}

export function useDemoWallet(options: UseDemoWalletOptions = {}) {
  const { onConnect, onDisconnect } = options;
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [connecting, setConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    if (connecting) return;

    try {
      setConnecting(true);
      await new Promise((resolve) => setTimeout(resolve, 700));
      const mockAddress =
        "5" + Math.random().toString(36).substring(2, 12).toUpperCase();
      setWalletAddress(mockAddress);
      setWalletConnected(true);
      await onConnect?.(mockAddress);
    } finally {
      setConnecting(false);
    }
  }, [connecting, onConnect]);

  const disconnectWallet = useCallback(() => {
    setWalletConnected(false);
    setWalletAddress("");
    onDisconnect?.();
  }, [onDisconnect]);

  return {
    walletConnected,
    walletAddress,
    connectWallet,
    disconnectWallet,
    connecting,
  };
}
