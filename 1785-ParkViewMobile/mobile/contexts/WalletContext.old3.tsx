import React, { createContext, useState, useContext, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useSDK } from '@metamask/sdk-react-native';
import WalletModal from '../components/WalletModal';
import { formatEther } from 'viem';
import { publicClient } from '../config/wagmi';
import { getMantleSepolia } from '../config/metamask';

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
  const { sdk, provider, connected } = useSDK();
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(5003);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const fetchBalance = useCallback(async (addr: string) => {
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
  }, []);

  const connectMetaMask = useCallback(async () => {
    try {
      setIsConnecting(true);
      setShowWalletModal(false);

      if (!provider) {
        throw new Error('MetaMask provider not found');
      }

      console.log('📱 Requesting MetaMask connection...');

      const accounts = await sdk?.connect() as string[] | undefined;

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const connectedAddress = accounts[0];
      console.log('✅ MetaMask connected:', connectedAddress);
      setAddress(connectedAddress);

      const currentChain = await provider.request({
        method: 'eth_chainId',
      }) as string;

      const currentChainId = parseInt(currentChain, 16);
      setChainId(currentChainId);

      if (currentChainId !== 5003) {
        Alert.alert(
          '切换网络',
          '应用需要连接到 Mantle Sepolia 测试网',
          [
            { text: '取消', style: 'cancel', onPress: () => {
              fetchBalance(connectedAddress);
            }},
            { text: '切换', onPress: async () => {
              await switchChain(5003);
              fetchBalance(connectedAddress);
            }}
          ]
        );
      } else {
        fetchBalance(connectedAddress);
      }

      Alert.alert('连接成功', '已连接到 MetaMask');
    } catch (error: any) {
      console.error('MetaMask connection error:', error);

      if (error.code === 4001) {
        Alert.alert('连接取消', '用户拒绝了连接请求');
      } else {
        Alert.alert('连接失败', error.message || '无法连接到 MetaMask');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [sdk, provider, fetchBalance]);

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
  }, [fetchBalance]);

  const disconnect = useCallback(async () => {
    try {
      if (!isDemoMode && sdk) {
        await sdk.terminate();
      }
      setAddress(null);
      setBalance(null);
      setChainId(5003);
      setIsDemoMode(false);
      Alert.alert('已断开', '钱包已断开连接');
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('错误', '断开连接时出错');
    }
  }, [sdk, isDemoMode]);

  const switchChain = useCallback(async (newChainId: number) => {
    if (isDemoMode) {
      Alert.alert('提示', '演示模式不支持切换链');
      return;
    }

    if (!provider) {
      Alert.alert('错误', 'Provider 未初始化');
      return;
    }

    try {
      const chainIdHex = `0x${newChainId.toString(16)}`;

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });

        setChainId(newChainId);
        console.log('✅ Switched to chain:', newChainId);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          const mantleConfig = getMantleSepolia();

          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: mantleConfig.chainIdHex,
              chainName: mantleConfig.chainName,
              rpcUrls: [mantleConfig.rpcUrl],
              nativeCurrency: mantleConfig.nativeCurrency,
              blockExplorerUrls: [mantleConfig.blockExplorerUrl],
            }],
          });

          setChainId(newChainId);
          console.log('✅ Added and switched to chain:', newChainId);
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error('Switch chain error:', error);

      if (error.code === 4001) {
        Alert.alert('切换取消', '用户拒绝了切换网络请求');
      } else {
        Alert.alert('切换失败', error.message || '无法切换网络');
      }
    }
  }, [provider, isDemoMode]);

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
        onSelectWallet={async (wallet) => {
          if (wallet.name === 'MetaMask') {
            await connectMetaMask();
          } else {
            Alert.alert('即将推出', `${wallet.name} 集成正在开发中`);
          }
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
