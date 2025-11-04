"use client";

import { useCallback, useState } from "react";

// Define a simplified account type to avoid polkadot type issues
interface PolkadotAccount {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
}

/**
 * Hook for connecting to Polkadot.js extension wallets
 * Supports: Polkadot.js, Talisman, SubWallet, etc.
 */
export function usePolkadotWallet() {
  const [accounts, setAccounts] = useState<PolkadotAccount[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<PolkadotAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Connect to Polkadot.js extension
   */
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Dynamic import to avoid SSR issues
      const { web3Accounts, web3Enable } = await import(
        "@polkadot/extension-dapp"
      );

      // Request access to extension
      const extensions = await web3Enable("Web3 Voting DApp");

      if (extensions.length === 0) {
        throw new Error(
          "No Polkadot extension found. Please install Polkadot.js, Talisman, or SubWallet.",
        );
      }

      // Get all accounts
      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        throw new Error("No accounts found in your wallet extension.");
      }

      // Convert to our simplified type
      const mappedAccounts: PolkadotAccount[] = allAccounts.map((acc) => ({
        address: acc.address,
        meta: {
          name: acc.meta.name,
          source: acc.meta.source,
        },
      }));

      setAccounts(mappedAccounts);
      setSelectedAccount(mappedAccounts[0]!);
      setIsConnected(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      console.error("Error connecting to Polkadot wallet:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setAccounts([]);
    setSelectedAccount(null);
    setIsConnected(false);
    setError(null);
  }, []);

  /**
   * Select a specific account
   */
  const selectAccount = useCallback((account: PolkadotAccount) => {
    setSelectedAccount(account);
  }, []);

  return {
    accounts,
    selectedAccount,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    selectAccount,
    address: selectedAccount?.address,
  };
}
