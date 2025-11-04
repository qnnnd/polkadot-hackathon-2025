// ========================================
// 🔧 WalletConnect 配置
// 
// 注意: WalletConnect v2 在 React Native 环境中存在已知的兼容性问题
// 当前使用演示模式进行开发和测试
// 
// 待解决的问题:
// 1. @reown/appkit-react-native - 缺少必需的模块 (wui-overlay)
// 2. @walletconnect/sign-client - forEach undefined 错误
// 3. @walletconnect/modal-react-native - API 已过时
// 
// 未来集成方案:
// - 等待 Reown AppKit 修复 React Native 兼容性问题
// - 或使用 @walletconnect/ethereum-provider + 自定义 UI
// - 或使用钱包特定的 SDK (MetaMask SDK, Trust Wallet SDK)
// ========================================

// CRITICAL: 这个 import 必须放在最前面
import '@walletconnect/react-native-compat';
import '../polyfills';

// WalletConnect Project ID
export const PROJECT_ID = '3c0f853ec8c67f02d869a67a82301dcc';

// Mantle Sepolia 配置
export const MANTLE_SEPOLIA_CHAIN_ID = 5003;
export const MANTLE_SEPOLIA_RPC = 'https://rpc.sepolia.mantle.xyz';
export const MANTLE_SEPOLIA_NAME = 'Mantle Sepolia';
export const MANTLE_SEPOLIA_EXPLORER = 'https://sepolia.mantlescan.xyz';

console.log('✅ WalletConnect config loaded (Demo mode)');

// ========================================
// 导出类型定义
// ========================================
export type Web3ModalInstance = typeof web3Modal;

    // 深度链接配置(用于移动端钱包回调)
    redirect: {
      native: 'parkview://',
      universal: 'https://parkview.app',
    },
  },
});

console.log('✅ Reown AppKit initialized successfully');

// ========================================
// 导出类型定义
// ========================================
export type AppKitInstance = typeof appKit;

