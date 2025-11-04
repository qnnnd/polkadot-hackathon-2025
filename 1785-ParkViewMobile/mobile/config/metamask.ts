import { MANTLE_SEPOLIA_CHAIN_ID, MANTLE_SEPOLIA_RPC, MANTLE_SEPOLIA_NAME } from './walletconnect';

// MetaMask SDK 配置
export const METAMASK_CONFIG = {
  // App 元数据
  dappMetadata: {
    name: 'ParkView',
    url: 'https://parkview.app',
    iconUrl: 'https://parkview.app/icon.png',
    scheme: 'parkview', // Deep linking scheme
  },
  
  // SDK 选项
  sdkOptions: {
    dappMetadata: {
      name: 'ParkView',
      url: 'https://parkview.app',
      iconUrl: 'https://parkview.app/icon.png',
      scheme: 'parkview',
    },
    logging: {
      developerMode: __DEV__, // 开发模式下启用日志
    },
    storage: {
      enabled: true, // 启用持久化存储
    },
    i18nOptions: {
      enabled: true,
    },
    // 开启后台定时器支持
    enableDebug: __DEV__,
  },
};

// 链配置辅助函数
export const getMantleSepolia = () => ({
  chainId: MANTLE_SEPOLIA_CHAIN_ID,
  chainIdHex: `0x${MANTLE_SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: MANTLE_SEPOLIA_NAME,
  rpcUrl: MANTLE_SEPOLIA_RPC,
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
  },
  blockExplorerUrl: 'https://sepolia.mantlescan.xyz',
});
