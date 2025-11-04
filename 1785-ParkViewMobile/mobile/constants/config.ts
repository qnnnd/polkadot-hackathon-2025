import ParkingLotABI from '@/app/abi/ParkingLot.json';

/**
 * 智能合约配置
 */
export const CONTRACT_CONFIG = {
  // 合约地址 - 请根据实际部署地址修改
  ADDRESS: '0xYourContractAddress' as `0x${string}`,
  
  // 合约 ABI
  ABI: ParkingLotABI,
} as const;

/**
 * 支持的链配置
 */
export const CHAINS_CONFIG = {
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
  },
  MAINNET: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
  },
} as const;

/**
 * WalletConnect 项目 ID
 * 获取地址: https://cloud.walletconnect.com/
 */
export const WALLET_CONNECT_PROJECT_ID = 'YOUR_PROJECT_ID';

/**
 * 应用元数据
 */
export const APP_METADATA = {
  name: 'ParkView',
  description: '去中心化停车位租赁平台',
  url: 'https://parkview.app',
  icons: ['https://parkview.app/icon.png'],
};
