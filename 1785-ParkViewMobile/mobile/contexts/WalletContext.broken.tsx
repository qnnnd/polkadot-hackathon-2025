import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { formatEther } from 'viem';
import { publicClient } from '../config/wagmi';
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@walletconnect/modal-react-native';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // 使用 WalletConnect Modal hooks
  const { open } = useWeb3Modal();
  const { address: wcAddress, isConnected: wcConnected, chainId: wcChainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // 实际使用的地址和连接状态
  const address = wcAddress || null;
  const isConnected = wcConnected;
  const chainId = wcChainId || 5003;

  // 监听地址变化,自动获取余额
  useEffect(() => {
    if (wcAddress) {
      console.log('✅ WalletConnect account connected:', wcAddress);
      fetchBalance(wcAddress);
    } else {
      console.log('❌ WalletConnect account disconnected');
      setBalance(null);
    }
  }, [wcAddress]);

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

  // 打开 WalletConnect Modal
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      console.log('🔗 Opening WalletConnect modal...');
      await open();
    } catch (error) {
      console.error('Failed to open WalletConnect modal:', error);
      Alert.alert('连接失败', '无法打开钱包连接');
    } finally {
      setIsConnecting(false);
    }
  }, [open]);

  // 断开连接
  const disconnect = useCallback(async () => {
    try {
      if (walletProvider) {
        await walletProvider.disconnect();
      }
      setBalance(null);
      console.log('✅ Wallet disconnected');
      Alert.alert('已断开', '钱包已断开连接');
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('错误', '断开连接时出错');
    }
  }, [walletProvider]);

  // 切换链
  const switchChain = useCallback(async (newChainId: number) => {
    try {
      if (walletProvider) {
        await walletProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${newChainId.toString(16)}` }],
        });
      } else {
        Alert.alert('提示', '请在钱包中切换网络');
      }
    } catch (error) {
      console.error('Switch chain error:', error);
      Alert.alert('错误', '切换网络失败');
    }
  }, [walletProvider]);

  const value: WalletContextType = {
    address,
    isConnected,
    isConnecting,
    chainId,
    balance,
    connect,
    disconnect,
    switchChain,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
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
