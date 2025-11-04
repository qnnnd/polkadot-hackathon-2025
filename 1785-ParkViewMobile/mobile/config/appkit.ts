import '@walletconnect/react-native-compat';

// @ts-ignore - Web3Modal 1.x types compatibility
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi-react-native';
import { sepolia } from 'viem/chains';

import { mantleSepolia, WALLET_CONNECT_PROJECT_ID } from './wagmi';

const APP_SCHEME = 'parkview://';
const APP_WEBSITE = 'https://parkview.app';

// 1. 创建 Wagmi 配置
export const wagmiConfig = defaultWagmiConfig({
  chains: [mantleSepolia, sepolia],
  projectId: WALLET_CONNECT_PROJECT_ID,
  metadata: {
    name: 'ParkView',
    description: '去中心化停车位租赁平台',
    url: APP_WEBSITE,
    icons: ['https://parkview.app/icon.png'],
    redirect: {
      native: APP_SCHEME,
      universal: APP_WEBSITE
    }
  }
});

// 2. 创建 Web3Modal 实例
createWeb3Modal({
  projectId: WALLET_CONNECT_PROJECT_ID,
  wagmiConfig,
  defaultChain: mantleSepolia,
  enableAnalytics: false
});

export const APPKIT_NETWORKS = [mantleSepolia, sepolia];
