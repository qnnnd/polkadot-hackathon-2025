/**
 * WalletConnect 钱包上下文 - 纯 SignClient 实现
 * 不依赖 Web3Modal,使用自定义 UI
 */

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Alert, Linking, AppState } from 'react-native';
import SignClient from '@walletconnect/sign-client';
import type { SessionTypes } from '@walletconnect/types';
import { formatEther } from 'viem';
import { publicClient } from '../config/wagmi';
import { walletConnectStorage } from '../utils/walletConnectStorage';

const PROJECT_ID = '9f5e5740b1d939c695c50b1111a7d90d';
const MANTLE_SEPOLIA_CHAIN_ID = 5003;

interface WalletContextType {
  address: string | null;
  chainId: number;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  signClient: SignClient | null;
  session: SessionTypes.Struct | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  clearAllSessions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(MANTLE_SEPOLIA_CHAIN_ID);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);

  // 初始化 SignClient
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔄 Initializing WalletConnect SignClient...');
        
        const client = await SignClient.init({
          projectId: PROJECT_ID,
          metadata: {
            name: 'ParkView',
            description: '去中心化停车位租赁平台',
            url: 'https://parkview.app',
            icons: ['https://parkview.app/icon.png'],
          },
          storage: walletConnectStorage as any,
          logger: 'error', // 只显示错误日志，避免太多警告信息
        });
        
        setSignClient(client);
        setIsInitialized(true);
        console.log('✅ WalletConnect SignClient initialized successfully');
        
        // 监听 session 事件
        client.on('session_event', (event) => {
          console.log('📡 Session event:', event);
        });
        
        client.on('session_update', ({ topic, params }) => {
          console.log('🔄 Session update:', topic, params);
          const { namespaces } = params;
          const session = client.session.get(topic);
          const updatedSession = { ...session, namespaces };
          setSession(updatedSession);
        });
        
        client.on('session_delete', () => {
          console.log('🗑️ Session deleted');
          setSession(null);
          setAddress(null);
          setBalance(null);
        });
        
        console.log('✅ WalletConnect 事件监听器已设置');
        
        // 检查是否有旧的 session（但不自动恢复）
        const sessions = client.session.getAll();
        console.log('📋 检查现有 Sessions:', sessions.length);
        
        if (sessions.length > 0) {
          console.log('ℹ️ 发现旧的 Session，将在连接时清除');
          // 不自动恢复，让用户主动点击连接，这样可以确保创建新的、支持 Mantle Sepolia 的 session
        } else {
          console.log('ℹ️ 没有找到之前的 Session');
        }
      } catch (error) {
        console.error('❌ Failed to init SignClient:', error);
        setIsInitialized(false);
      }
    };

    init();
  }, []);

  // 获取余额
  const fetchBalance = useCallback(async (addr: string) => {
    try {
      const bal = await publicClient.getBalance({
        address: addr as `0x${string}`,
      });
      setBalance(formatEther(bal));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0');
    }
  }, []);

  // 监听地址变化获取余额
  useEffect(() => {
    if (address) {
      fetchBalance(address);
    }
  }, [address, fetchBalance]);

  // 监听应用从后台返回（从 MetaMask 返回时）
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('📱 App State 变化:', nextAppState);
      
      if (nextAppState === 'active') {
        console.log('✅ App 返回前台');
        
        // 只是记录日志，不干预连接流程
        // approval() 会自动处理 session 的建立
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 连接钱包
  // 连接钱包
  const connect = useCallback(async () => {
    if (!signClient) {
      Alert.alert('错误', 'WalletConnect 正在初始化，请稍后再试');
      return;
    }

    try {
      setIsConnecting(true);
      console.log('🔄 ========== 开始连接钱包 ==========');

      // 步骤 1: 清除所有旧的 session
      const oldSessions = signClient.session.getAll();
      console.log('📋 当前 Sessions 数量:', oldSessions.length);
      
      if (oldSessions.length > 0) {
        console.log('🧹 开始清除旧 Sessions...');
        for (const oldSession of oldSessions) {
          try {
            await signClient.disconnect({
              topic: oldSession.topic,
              reason: { code: 6000, message: 'Reconnecting' },
            });
            console.log('  ✅ 已断开:', oldSession.topic.substring(0, 8));
          } catch (err) {
            console.log('  ⚠️ 断开失败（忽略）');
          }
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // 清除本地状态
      setSession(null);
      setAddress(null);
      setBalance(null);
      console.log('✅ 本地状态已清除');
      
      // 步骤 2: 创建连接请求
      console.log('🆕 创建新的 WalletConnect 连接...');
      
      // 监听 session_proposal 事件
      const proposalListener = (proposal: any) => {
        console.log('📨 收到 Session Proposal:', JSON.stringify(proposal, null, 2));
      };
      signClient.on('session_proposal', proposalListener);
      
      // 使用 optionalNamespaces 代替 requiredNamespaces
      // 这样 MetaMask 可以显示批准界面,即使当前网络不匹配
      const { uri, approval } = await signClient.connect({
        optionalNamespaces: {
          eip155: {
            chains: [
              `eip155:${MANTLE_SEPOLIA_CHAIN_ID}`,  // Mantle Sepolia 测试网
              'eip155:1',      // Ethereum Mainnet  
              'eip155:56',     // BSC
              'eip155:137',    // Polygon
            ],
            methods: [
              'eth_sendTransaction',
              'personal_sign',
              'eth_signTypedData',
              'eth_signTypedData_v4',
            ],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      if (!uri) {
        throw new Error('未生成 URI');
      }

      console.log('✅ URI 已生成，长度:', uri.length);
      console.log('🔗 URI 内容:', uri);
      
      // 步骤 3: 尝试打开 MetaMask 
      
      // 方式 1: 使用 WalletConnect Universal Link (推荐)
      const universalLink = `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`;
      
      // 方式 2: 使用 MetaMask Deep Link (备用)
      const deepLink = `metamask://wc?uri=${encodeURIComponent(uri)}`;
      
      console.log('📱 尝试打开 MetaMask (Universal Link)...');
      console.log('🔗 Link:', universalLink.substring(0, 50) + '...');
      
      try {
        // 优先使用 Universal Link，这在 iOS 和 Android 上兼容性更好
        await Linking.openURL(universalLink);
        console.log('✅ MetaMask 已通过 Universal Link 启动');
      } catch (err) {
        console.log('⚠️ Universal Link 失败，尝试 Deep Link...');
        try {
          await Linking.openURL(deepLink);
          console.log('✅ MetaMask 已通过 Deep Link 启动');
        } catch (deepErr) {
          console.log('⚠️ Deep Link 也失败');
          Alert.alert(
            '错误',
            '无法打开 MetaMask，请确保已安装 MetaMask 应用',
            [{ text: '知道了' }]
          );
        }
      }

      // 步骤 4: 等待批准（60秒超时）
      console.log('⏳ 等待用户批准...');
      
      const newSession = await Promise.race([
        approval(),
        new Promise<SessionTypes.Struct>((_, reject) =>
          setTimeout(() => reject(new Error('连接超时，用户未批准')), 60000)
        ),
      ]);
      
      console.log('✅ 批准成功! Topic:', newSession.topic.substring(0, 8));
      
      setSession(newSession);

      const addr = newSession.namespaces.eip155.accounts[0].split(':')[2];
      setAddress(addr);

      console.log('✅ Connected to:', addr);
      
      // 检查 session 支持的链
      const supportedChains = newSession.namespaces.eip155.chains || [];
      console.log('📋 Session 支持的链:', supportedChains);
      
      // 检查是否支持 Mantle Sepolia
      const mantleChainId = `eip155:${MANTLE_SEPOLIA_CHAIN_ID}`;
      if (supportedChains.includes(mantleChainId)) {
        console.log('✅ Session 已支持 Mantle Sepolia');
        Alert.alert('连接成功', `已连接到: ${addr.slice(0, 6)}...${addr.slice(-4)}\n\n网络: Mantle Sepolia`);
      } else {
        console.warn('⚠️ Session 不支持 Mantle Sepolia');
        Alert.alert(
          '⚠️ 网络不匹配',
          `已连接到: ${addr.slice(0, 6)}...${addr.slice(-4)}\n\n但当前网络不是 Mantle Sepolia，某些功能可能无法使用。\n\n请在 MetaMask 中切换到 Mantle Sepolia 网络。`,
          [{ text: '知道了' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
        Alert.alert('连接取消', '您拒绝了连接请求');
      } else if (error.message?.includes('timeout') || error.message?.includes('超时')) {
        Alert.alert('连接超时', '连接请求超时，请重试');
      } else {
        Alert.alert('连接失败', error.message || '无法连接钱包，请重试');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [signClient]);
  const disconnect = useCallback(async () => {
    if (!signClient || !session) return;

    try {
      await signClient.disconnect({
        topic: session.topic,
        reason: {
          code: 6000,
          message: 'User disconnected',
        },
      });

      setSession(null);
      setAddress(null);
      setBalance(null);

      Alert.alert('已断开', '钱包已断开连接');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [signClient, session]);

  // 切换网络
  const switchNetwork = useCallback(async (newChainId: number) => {
    if (!signClient || !session) {
      Alert.alert('错误', '请先连接钱包');
      return;
    }

    try {
      await signClient.request({
        topic: session.topic,
        chainId: `eip155:${newChainId}`,
        request: {
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${newChainId.toString(16)}` }],
        },
      });

      setChainId(newChainId);
      Alert.alert('网络切换成功', `已切换到链 ID: ${newChainId}`);
    } catch (error: any) {
      console.error('Switch network error:', error);
      Alert.alert('切换失败', error.message || '无法切换网络');
    }
  }, [signClient, session]);

  // 清除所有 session（用于调试和重置）
  const clearAllSessions = useCallback(async () => {
    if (!signClient) {
      console.log('⚠️ SignClient 未初始化');
      return;
    }

    try {
      console.log('🧹 开始清除所有 WalletConnect Sessions...');
      const sessions = signClient.session.getAll();
      console.log('📋 找到 Sessions:', sessions.length);

      for (const session of sessions) {
        try {
          console.log('🗑️ 断开 Session:', session.topic);
          await signClient.disconnect({
            topic: session.topic,
            reason: {
              code: 6000,
              message: 'Manual cleanup',
            },
          });
        } catch (err) {
          console.log('⚠️ 断开 Session 失败（可能已失效）:', err);
        }
      }

      setSession(null);
      setAddress(null);
      setBalance(null);

      console.log('✅ 所有 Sessions 已清除');
      Alert.alert(
        '已清除连接数据',
        '请同时在 MetaMask 中清除 ParkView 的连接：\n\n1. 打开 MetaMask\n2. 设置 → 安全与隐私\n3. 清除隐私数据 → 清除已连接的网站',
        [{ text: '知道了' }]
      );
    } catch (error) {
      console.error('❌ 清除 Sessions 失败:', error);
    }
  }, [signClient]);

  const value: WalletContextType = {
    address,
    chainId,
    balance,
    isConnected: !!address,
    isConnecting,
    isInitialized,
    signClient,
    session,
    connect,
    disconnect,
    switchNetwork,
    clearAllSessions,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
