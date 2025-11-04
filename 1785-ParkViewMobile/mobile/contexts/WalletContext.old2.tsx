import React, { createContext, useState, useContext, useCallback } from 'react';
import { Alert } from 'react-native';
import WalletModal from '../components/WalletModal';
import { formatEther } from 'viem';
import { publicClient } from '../config/wagmi';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  useDemoMode: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(5003);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // 获取余额
  const fetchBalance = async (addr: string) => {
    try {
      const bal = await publicClient.getBalance({
        address: addr as `0x${string}`
      });
      setBalance(formatEther(bal));
      console.log('💰 Balance:', formatEther(bal), 'MNT');
    } catch (error) {
      console.error('Failed to get balance:', error);
      setBalance('0');
    }
  };

  // 连接钱包 (演示模式)
  const connect = useCallback(async () => {
    setShowWalletModal(true);
  }, []);

  // 演示模式连接
  const useDemoMode = useCallback(async () => {
    try {
      setIsConnecting(true);
      setShowWalletModal(false);
      
      const demoAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8';
      setAddress(demoAddress);
      setChainId(5003);
      
      await fetchBalance(demoAddress);
      console.log('✅ Demo wallet connected:', demoAddress);
      Alert.alert('演示模式', '已连接演示钱包');
    } catch (error) {
      console.error('Demo mode error:', error);
      Alert.alert('错误', '演示模式启动失败');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // 断开连接
  const disconnect = useCallback(async () => {
    setAddress(null);
    setBalance(null);
    setChainId(5003);
    console.log('✅ Wallet disconnected');
    Alert.alert('已断开', '钱包已断开连接');
  }, []);

  // 切换链
  const switchChain = useCallback(async (newChainId: number) => {
    Alert.alert('提示', '演示模式不支持切换链');
  }, []);

  const value: WalletContextType = {
    address,
    isConnected: !!address,
    isConnecting,
    chainId,
    balance,
    connect,
    disconnect,
    switchChain,
    useDemoMode,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      <WalletModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSelectWallet={async () => {
          Alert.alert(
            '功能开发中',
            'WalletConnect 集成遇到兼容性问题,暂时请使用演示模式。\n\n我们正在积极寻找解决方案。',
            [{ text: '使用演示模式', onPress: () => useDemoMode() }]
          );
        }}
        onDemoMode={() => {
          setShowWalletModal(false);
          useDemoMode();
        }}
      />
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
}
