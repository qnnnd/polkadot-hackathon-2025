import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import WalletModal from '../components/WalletModal';
import { formatEther } from 'viem';
import { publicClient } from '../config/wagmi';
import { useAppKit, useAccount } from '@reown/appkit-react-native';

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
  // 使用 Reown AppKit hooks
  const { open, disconnect: appKitDisconnect, switchNetwork } = useAppKit();
  const { address: appKitAddress, isConnected: appKitConnected, chainId: appKitChainId } = useAccount();
  
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Demo mode 状态
  const [demoAddress, setDemoAddress] = useState<string | null>(null);
  const [demoChainId] = useState<number>(5003);
  
  // 实际使用的地址和连接状态
  const address = isDemoMode ? demoAddress : appKitAddress;
  const isConnected = isDemoMode ? !!demoAddress : appKitConnected;
  const chainId = isDemoMode ? demoChainId : (appKitChainId ? Number(appKitChainId) : 5003);

  // 监听 AppKit 地址变化,自动获取余额
  useEffect(() => {
    if (appKitAddress && !isDemoMode) {
      console.log('✅ AppKit account connected:', appKitAddress);
      fetchBalance(appKitAddress);
    } else if (!appKitAddress && !isDemoMode) {
      console.log('❌ AppKit account disconnected');
      setBalance(null);
    }
  }, [appKitAddress, isDemoMode]);

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

  // 打开 AppKit Modal 进行连接(使用原生 modal,不是自定义的)
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      console.log('🔗 Opening AppKit modal...');
      // 直接打开 AppKit 的原生 modal
      await open({ view: 'Connect' });
    } catch (error) {
      console.error('Failed to open AppKit:', error);
      Alert.alert('连接失败', '无法打开钱包连接');
    } finally {
      setIsConnecting(false);
    }
  }, [open]);

  // 演示模式连接(用于测试)
  const useDemoMode = useCallback(async () => {
    try {
      setIsConnecting(true);
      setShowWalletModal(false);
      setIsDemoMode(true);
      
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8';
      setDemoAddress(testAddress);
      
      try {
        const bal = await publicClient.getBalance({ 
          address: testAddress as `0x${string}` 
        });
        setBalance(formatEther(bal));
        console.log('✅ Demo wallet connected:', testAddress);
        console.log('💰 Balance:', formatEther(bal), 'MNT');
      } catch (error) {
        console.error('Failed to get balance:', error);
        setBalance('0');
      }
    } catch (error) {
      console.error('Demo mode error:', error);
      Alert.alert('错误', '演示模式启动失败');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // 断开连接
  const disconnect = useCallback(async () => {
    try {
      if (!isDemoMode && appKitDisconnect) {
        await appKitDisconnect();
      }
      
      setDemoAddress(null);
      setBalance(null);
      setIsDemoMode(false);
      console.log('✅ Wallet disconnected');
      Alert.alert('已断开', '钱包已断开连接');
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('错误', '断开连接时出错');
    }
  }, [isDemoMode, appKitDisconnect]);

  // 切换链
  const switchChain = useCallback(async (newChainId: number) => {
    if (isDemoMode) {
      Alert.alert('提示', '演示模式不支持切换链');
      return;
    }
    
    try {
      if (switchNetwork) {
        await switchNetwork(newChainId);
      } else {
        Alert.alert('提示', '请在钱包中切换网络');
      }
    } catch (error) {
      console.error('Switch chain error:', error);
      Alert.alert('错误', '切换网络失败');
    }
  }, [isDemoMode, switchNetwork]);

  const value: WalletContextType = {
    address,
    isConnected,
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
        onSelectWallet={async (wallet) => {
          // 当用户从自定义 modal 选择钱包时,打开 AppKit
          setShowWalletModal(false);
          await connect();
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
