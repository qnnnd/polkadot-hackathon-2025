import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import type { Chain } from 'viem';

/**
 * Mantle Sepolia 测试网配置
 */
export const mantleSepolia: Chain = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
    public: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.sepolia.mantle.xyz' },
  },
  testnet: true,
};

/**
 * WalletConnect 项目 ID
 * 请访问 https://cloud.walletconnect.com/ 创建项目并获取 ID
 */
export const WALLET_CONNECT_PROJECT_ID = '9f5e5740b1d939c695c50b1111a7d90d';

/**
 * 应用元数据
 */
export const metadata = {
  name: 'ParkView',
  description: '去中心化停车位租赁平台',
  url: 'https://parkview.app',
  icons: ['https://parkview.app/icon.png'],
};

/**
 * 支持的链配置
 */
export const chains = [mantleSepolia, sepolia, mainnet] as const;

/**
 * 智能合约地址
 * 请根据实际部署的合约地址修改
 */
export const CONTRACT_ADDRESS = '0x32cE53dEd16b49d4528FeF7324Df1a77E7a64b55' as `0x${string}`;

/**
 * 创建 Public Client (用于读取合约)
 */
export function createPublicClientForChain(chainId: number) {
  const chain = chains.find(c => c.id === chainId) || mantleSepolia;
  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * 默认 Public Client (Mantle Sepolia)
 */
export const publicClient = createPublicClient({
  chain: mantleSepolia,
  transport: http(),
});
