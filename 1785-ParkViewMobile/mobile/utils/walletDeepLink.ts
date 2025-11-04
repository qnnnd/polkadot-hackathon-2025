/**
 * 深度链接钱包连接工具
 * 无原生依赖,纯 JavaScript 实现
 */

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WalletConfig {
  name: string;
  scheme: string; // 深度链接 scheme
  universalLink?: string; // Universal Link (可选)
  downloadUrl: string; // 钱包下载链接
}

// 支持的钱包配置
export const SUPPORTED_WALLETS: WalletConfig[] = [
  {
    name: 'MetaMask',
    scheme: 'metamask://',
    universalLink: 'https://metamask.app.link',
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    name: 'Trust Wallet',
    scheme: 'trust://',
    universalLink: 'https://link.trustwallet.com',
    downloadUrl: 'https://trustwallet.com/download',
  },
  {
    name: 'Rainbow',
    scheme: 'rainbow://',
    downloadUrl: 'https://rainbow.me/download',
  },
  {
    name: 'Coinbase Wallet',
    scheme: 'cbwallet://',
    downloadUrl: 'https://www.coinbase.com/wallet/downloads',
  },
];

// 存储 key
const STORAGE_KEYS = {
  WALLET_ADDRESS: '@parkview:wallet_address',
  WALLET_NAME: '@parkview:wallet_name',
  CHAIN_ID: '@parkview:chain_id',
};

/**
 * 生成 WalletConnect URI (简化版)
 * 用于通过深度链接传递连接请求
 */
export function generateWalletConnectURI(
  bridge: string = 'https://bridge.walletconnect.org',
  key: string = Math.random().toString(36).substring(7)
): string {
  const uri = `wc:${key}@1?bridge=${encodeURIComponent(bridge)}&key=${key}`;
  return uri;
}

/**
 * 通过深度链接打开钱包
 * 
 * MetaMask Mobile 使用 Universal Link 而不是 deep link scheme
 * 格式: https://metamask.app.link/dapp/<your_dapp_url>
 * 
 * 或者使用连接参数:
 * https://metamask.app.link/connect?redirect=<encoded_callback_url>
 */
export async function openWalletViaDeepLink(
  wallet: WalletConfig,
  connectionData?: {
    uri?: string;
    chainId?: number;
    callback?: string;
  }
): Promise<boolean> {
  try {
    const { scheme, universalLink, name } = wallet;
    
    let linkToOpen = '';
    
    if (name === 'MetaMask') {
      // MetaMask 需要使用 Universal Link
      // 方案 1: 通过 DApp URL (推荐)
      // https://metamask.app.link/dapp/parkview.app
      
      // 方案 2: 直接连接请求 (我们使用这个)
      // https://metamask.app.link/connect
      
      if (connectionData?.callback) {
        // 编码回调 URL
        const encodedCallback = encodeURIComponent(connectionData.callback);
        
        // 使用 Universal Link 格式
        linkToOpen = `https://metamask.app.link/connect?redirect=${encodedCallback}`;
        
        // 如果有链 ID,添加到参数中
        if (connectionData.chainId) {
          const chainIdHex = `0x${connectionData.chainId.toString(16)}`;
          linkToOpen += `&chainId=${chainIdHex}`;
        }
      } else {
        // 没有回调,使用简单的打开方式
        linkToOpen = 'https://metamask.app.link/';
      }
      
      console.log('🦊 Opening MetaMask via Universal Link:', linkToOpen);
      
      // 使用 WebBrowser 打开 Universal Link
      const result = await WebBrowser.openBrowserAsync(linkToOpen, {
        // 这会尝试在 MetaMask 应用中打开
        dismissButtonStyle: 'close',
        readerMode: false,
      });
      
      console.log('🦊 WebBrowser result:', result);
      return true;
      
    } else if (name === 'Trust Wallet') {
      // Trust Wallet 使用 deep link scheme
      if (connectionData?.uri) {
        linkToOpen = `trust://wallet_connect?uri=${encodeURIComponent(connectionData.uri)}`;
      } else {
        linkToOpen = scheme;
      }
      
      console.log('💎 Opening Trust Wallet:', linkToOpen);
      
      const canOpen = await Linking.canOpenURL(linkToOpen);
      if (canOpen) {
        await Linking.openURL(linkToOpen);
        return true;
      }
      
    } else {
      // 其他钱包使用通用格式
      linkToOpen = scheme;
      
      if (connectionData) {
        const params = new URLSearchParams();
        
        if (connectionData.uri) {
          params.append('uri', connectionData.uri);
        }
        
        if (connectionData.chainId) {
          params.append('chainId', connectionData.chainId.toString());
        }
        
        if (connectionData.callback) {
          params.append('redirect', connectionData.callback);
        }
        
        linkToOpen += `?${params.toString()}`;
      }
      
      console.log('🔗 Opening wallet:', name, linkToOpen);
      
      const canOpen = await Linking.canOpenURL(linkToOpen);
      if (canOpen) {
        await Linking.openURL(linkToOpen);
        return true;
      }
    }
    
    // 如果无法打开,提示下载
    console.log('📱 Wallet not installed, opening download page');
    await WebBrowser.openBrowserAsync(wallet.downloadUrl);
    return false;
    
  } catch (error) {
    console.error('Failed to open wallet:', error);
    return false;
  }
}

/**
 * 保存钱包连接信息
 */
export async function saveWalletConnection(
  address: string,
  walletName: string,
  chainId: number
): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.WALLET_ADDRESS, address],
      [STORAGE_KEYS.WALLET_NAME, walletName],
      [STORAGE_KEYS.CHAIN_ID, chainId.toString()],
    ]);
    console.log('✅ Wallet connection saved:', { address, walletName, chainId });
  } catch (error) {
    console.error('Failed to save wallet connection:', error);
  }
}

/**
 * 获取已保存的钱包连接信息
 */
export async function getSavedWalletConnection(): Promise<{
  address: string | null;
  walletName: string | null;
  chainId: number | null;
}> {
  try {
    const values = await AsyncStorage.multiGet([
      STORAGE_KEYS.WALLET_ADDRESS,
      STORAGE_KEYS.WALLET_NAME,
      STORAGE_KEYS.CHAIN_ID,
    ]);
    
    return {
      address: values[0][1],
      walletName: values[1][1],
      chainId: values[2][1] ? parseInt(values[2][1]) : null,
    };
  } catch (error) {
    console.error('Failed to get saved wallet connection:', error);
    return { address: null, walletName: null, chainId: null };
  }
}

/**
 * 清除钱包连接信息
 */
export async function clearWalletConnection(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.WALLET_ADDRESS,
      STORAGE_KEYS.WALLET_NAME,
      STORAGE_KEYS.CHAIN_ID,
    ]);
    console.log('✅ Wallet connection cleared');
  } catch (error) {
    console.error('Failed to clear wallet connection:', error);
  }
}

/**
 * 处理从钱包返回的深度链接
 * 
 * MetaMask 回调格式:
 * parkview://wallet-callback?address=0x123...&chainId=0x138b
 * 
 * 或者可能是:
 * parkview://wallet-callback?account=0x123...
 */
export function parseWalletCallback(url: string): {
  address?: string;
  chainId?: number;
  approved?: boolean;
} | null {
  try {
    console.log('🔍 Parsing wallet callback URL:', url);
    
    const parsed = Linking.parse(url);
    const { queryParams } = parsed;
    
    console.log('📋 Query params:', queryParams);
    
    // MetaMask 可能使用 'address' 或 'account' 参数
    const address = (queryParams?.address || queryParams?.account) as string | undefined;
    
    // 解析链 ID (可能是十六进制或十进制)
    let chainId: number | undefined;
    if (queryParams?.chainId) {
      const chainIdStr = queryParams.chainId as string;
      // 如果是十六进制 (0x开头)
      if (chainIdStr.startsWith('0x')) {
        chainId = parseInt(chainIdStr, 16);
      } else {
        chainId = parseInt(chainIdStr);
      }
    }
    
    // 如果有地址,说明连接已批准
    const approved = !!address || queryParams?.approved === 'true';
    
    const result = {
      address,
      chainId,
      approved,
    };
    
    console.log('✅ Parsed result:', result);
    
    return result;
  } catch (error) {
    console.error('Failed to parse wallet callback:', error);
    return null;
  }
}
