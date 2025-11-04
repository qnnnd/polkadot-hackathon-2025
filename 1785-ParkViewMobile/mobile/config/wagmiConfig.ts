/**
 * Wagmi 配置 - 不依赖 Web3Modal
 */
// @ts-ignore - wagmi 1.x compatibility
import { configureChains, createConfig } from 'wagmi';
// @ts-ignore - wagmi 1.x compatibility
import { publicProvider } from 'wagmi/providers/public';
import { sepolia } from 'viem/chains';
import { mantleSepolia } from './wagmi';

const { chains, publicClient } = configureChains(
  [mantleSepolia, sepolia],
  [publicProvider()]
);

export const wagmiConfig = createConfig({
  autoConnect: false,
  publicClient,
});

export const APPKIT_NETWORKS = chains;

