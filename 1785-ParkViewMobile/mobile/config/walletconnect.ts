// ========================================
// 🔧 WalletConnect v2 配置
// 使用 @walletconnect/sign-client 进行钱包连接
// ========================================

// CRITICAL: 这个 import 必须放在最前面
import '@walletconnect/react-native-compat';
import '../polyfills';
import SignClient from '@walletconnect/sign-client';
import type { SignClientTypes, SessionTypes, ProposalTypes } from '@walletconnect/types';
import NetInfo from '@react-native-community/netinfo';

// WalletConnect Cloud Project ID
export const PROJECT_ID = '9f5e5740b1d939c695c50b1111a7d90d';

// Mantle Sepolia 配置
export const MANTLE_SEPOLIA_CHAIN_ID = 5003;
export const MANTLE_SEPOLIA_RPC = 'https://rpc.sepolia.mantle.xyz';
export const MANTLE_SEPOLIA_NAME = 'Mantle Sepolia';
export const MANTLE_SEPOLIA_EXPLORER = 'https://sepolia.mantlescan.xyz';

// WalletConnect 元数据
export const WALLET_CONNECT_METADATA: SignClientTypes.Metadata = {
  name: 'ParkView',
  description: 'Decentralized Parking Application',
  url: 'https://parkview.app',
  icons: ['https://parkview.app/icon.png'],
};

// Required Namespaces 配置
export const REQUIRED_NAMESPACES: ProposalTypes.RequiredNamespaces = {
  eip155: {
    methods: [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v4',
    ],
    chains: [`eip155:${MANTLE_SEPOLIA_CHAIN_ID}`],
    events: ['chainChanged', 'accountsChanged'],
  },
};

// SignClient 单例
let signClient: InstanceType<typeof SignClient> | null = null;

// 初始化 WalletConnect SignClient
export async function initSignClient(): Promise<InstanceType<typeof SignClient>> {
  if (signClient) {
    return signClient;
  }

  console.log('🔄 Initializing WalletConnect SignClient...');
  
  try {
    // 强制设置网络为在线状态 (React Native 环境下的 hack)
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'onLine', {
        get: () => true,
        configurable: true,
      });
    }
    
    // 检查网络连接状态
    const netInfoState = await NetInfo.fetch();
    console.log('📡 Network state:', {
      isConnected: netInfoState.isConnected,
      isInternetReachable: netInfoState.isInternetReachable,
      type: netInfoState.type,
    });

    // 如果没有网络，抛出更友好的错误
    if (netInfoState.isConnected === false) {
      throw new Error('请检查您的网络连接');
    }

    signClient = await SignClient.init({
      projectId: PROJECT_ID,
      metadata: WALLET_CONNECT_METADATA,
      relayUrl: 'wss://relay.walletconnect.com',
    });

    console.log('✅ WalletConnect SignClient initialized');
    return signClient;
  } catch (error) {
    console.error('❌ Failed to initialize SignClient:', error);
    throw error;
  }
}

// 获取 SignClient 实例
export function getSignClient(): InstanceType<typeof SignClient> | null {
  return signClient;
}

// 完全重置 WalletConnect (清除所有会话和配对)
export async function resetWalletConnect(): Promise<void> {
  const client = getSignClient();
  if (!client) {
    console.log('⚠️ No SignClient to reset');
    return;
  }

  try {
    console.log('🔄 Resetting WalletConnect...');
    
    // 清理所有会话
    const sessions = client.session.getAll();
    console.log('🗑️ Disconnecting', sessions.length, 'sessions');
    for (const session of sessions) {
      try {
        await client.disconnect({
          topic: session.topic,
          reason: { code: 6000, message: 'User disconnected' },
        });
      } catch (err) {
        console.log('⚠️ Error disconnecting session:', err);
      }
    }

    // 清理所有配对
    const pairings = client.core.pairing.getPairings();
    console.log('🗑️ Disconnecting', pairings.length, 'pairings');
    for (const pairing of pairings) {
      try {
        await client.core.pairing.disconnect({ topic: pairing.topic });
      } catch (err) {
        console.log('⚠️ Error disconnecting pairing:', err);
      }
    }

    console.log('✅ WalletConnect reset complete');
  } catch (error) {
    console.error('❌ Error resetting WalletConnect:', error);
  }
}

console.log('✅ WalletConnect config loaded');
