import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import * as Linking from 'expo-linking';
import WalletModal from '../components/WalletModal';
import { formatEther } from 'viem';
import { publicClient } from '../config/wagmi';
import {
  WalletConfig,
  openWalletViaDeepLink,
  saveWalletConnection,
  getSavedWalletConnection,
  clearWalletConnection,
  parseWalletCallback,
} from '../utils/walletDeepLink';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number;
  balance: string | null;
  walletName: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  useDemoMode: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(5003);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const restoreSavedConnection = async () => {
    try {
      const saved = await getSavedWalletConnection();
      if (saved.address && saved.chainId) {
        console.log('🔄 Restoring saved connection:', saved.address);
        setAddress(saved.address);
        setWalletName(saved.walletName);
        setChainId(saved.chainId);
        await fetchBalance(saved.address);
      }
    } catch (error) {
      console.error('Failed to restore connection:', error);
    }
  };

  const handleDeepLink = ({ url }: { url: string }) => {
    console.log('🔗 Deep link received:', url);
    const parsed = parseWalletCallback(url);
    if (parsed && parsed.approved && parsed.address) {
      console.log('✅ Connection approved:', parsed.address);
      setAddress(parsed.address);
      setChainId(parsed.chainId || 5003);
      setIsConnecting(false);
      saveWalletConnection(parsed.address, walletName || 'Unknown', parsed.chainId || 5003);
      fetchBalance(parsed.address);
      Alert.alert('连接成功', `地址: ${parsed.address.slice(0, 6)}...${parsed.address.slice(-4)}`);
    }
  };

  const fetchBalance = async (addr: string) => {
    try {
      const bal = await publicClient.getBalance({ address: addr as `0x${string}` });
      setBalance(formatEther(bal));
      console.log('💰 Balance:', formatEther(bal), 'MNT');
    } catch (error) {
      console.error('Failed to get balance:', error);
      setBalance('0');
    }
  };

  useEffect(() => {
    restoreSavedConnection();
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && address && !isDemoMode) {
        fetchBalance(address);
      }
    });
    return () => subscription.remove();
  }, [address, isDemoMode]);

  const openWallet = async (wallet: WalletConfig) => {
    try {
      setIsConnecting(true);
      setShowWalletModal(false);
      setWalletName(wallet.name);
      const callbackUrl = Linking.createURL('wallet-callback');
      console.log('📱 Opening wallet:', wallet.name);
      const opened = await openWalletViaDeepLink(wallet, { chainId: 5003, callback: callbackUrl });
      if (!opened) {
        Alert.alert('钱包未安装', `请先安装 ${wallet.name}`, [
          { text: '取消', style: 'cancel', onPress: () => setIsConnecting(false) },
        ]);
      } else {
        Alert.alert('等待确认', `请在 ${wallet.name} 中批准连接`, [
          { text: '取消', style: 'cancel', onPress: () => setIsConnecting(false) },
        ]);
      }
    } catch (error) {
      console.error('Failed to open wallet:', error);
      Alert.alert('连接失败', '无法打开钱包应用');
      setIsConnecting(false);
    }
  };

  const connect = useCallback(async () => {
    setShowWalletModal(true);
  }, []);

  const useDemoMode = useCallback(async () => {
    try {
      setIsConnecting(true);
      setShowWalletModal(false);
      setIsDemoMode(true);
      const demoAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8';
      setAddress(demoAddress);
      setWalletName('Demo Wallet');
      setChainId(5003);
      const bal = await publicClient.getBalance({ address: demoAddress as `0x${string}` });
      setBalance(formatEther(bal));
      console.log('✅ Demo wallet connected');
      Alert.alert('演示模式', '已使用演示钱包连接');
    } catch (error) {
      console.error('Demo mode error:', error);
      Alert.alert('错误', '演示模式启动失败');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (!isDemoMode) await clearWalletConnection();
      setAddress(null);
      setWalletName(null);
      setBalance(null);
      setChainId(5003);
      setIsDemoMode(false);
      console.log('✅ Disconnected');
      Alert.alert('已断开', '钱包已断开连接');
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('错误', '断开连接时出错');
    }
  }, [isDemoMode]);

  const switchChain = useCallback(async (newChainId: number) => {
    if (isDemoMode) {
      Alert.alert('提示', '演示模式不支持切换链');
      return;
    }
    Alert.alert('提示', '请在钱包应用中切换网络');
  }, [isDemoMode]);

  const value: WalletContextType = {
    address,
    isConnected: !!address,
    isConnecting,
    chainId,
    balance,
    walletName,
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
        onSelectWallet={openWallet}
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
