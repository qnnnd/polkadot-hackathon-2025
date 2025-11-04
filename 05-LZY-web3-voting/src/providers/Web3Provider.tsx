"use client";

import { type ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/config/wagmi";

interface Web3ProviderProps {
  children: ReactNode;
}

/**
 * Web3Provider wraps the app with necessary providers for wallet connectivity
 * - WagmiProvider: For EVM wallet connections (Moonbeam)
 * - QueryClientProvider: For data fetching and caching
 *
 * Note: QueryClient is created inside the component to prevent recreation
 * during Fast Refresh, which causes WalletConnect to initialize multiple times
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Create QueryClient inside component to avoid Fast Refresh issues
  // This ensures the client is only created once per mount
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 60 * 1000, // 1 minute
          },
        },
      }),
  );

  // Always provide WagmiProvider, but handle SSR gracefully in the config
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
