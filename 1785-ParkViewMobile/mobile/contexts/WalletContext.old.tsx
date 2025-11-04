import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { Alert, AppState } from 'react-native';
// @ts-ignore - Web3Modal 1.x types compatibility
import { useWeb3Modal } from '@web3modal/wagmi-react-native';
// @ts-ignore - wagmi 1.x types compatibility
import { useAccount, useBalance, useDisconnect, useSwitchNetwork, useNetwork } from 'wagmi';
import { formatEther } from 'viem';

import { APPKIT_NETWORKS } from '../config/appkit';
import { metamaskConnector } from '../services/metamaskConnector';

const MANTLE_SEPOLIA_CHAIN_ID = 5003;
const DEMO_ADDRESS = '0x1234567890123456789012345678901234567890';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number;
  balance: string | null;
  walletName: string | null;
  isDemoMode: boolean;
  isManualMode: boolean;
  isMetaMaskMode: boolean;
  connect: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  connectManual: (address: string) => void;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  useDemoMode: () => void;
  sendTransaction: (tx: any) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { open } = useWeb3Modal();
  const { address: connectedAddress, isConnected: wagmiConnected, connector } = useAccount();
  const { chain } = useNetwork();
  const activeChainId = chain?.id;
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchNetwork: wagmiSwitchNetwork } = useSwitchNetwork();
  const { data: balanceData } = useBalance({
    address: connectedAddress
  });

  const [walletName, setWalletName] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isMetaMaskMode, setIsMetaMaskMode] = useState(false);
  const [demoAddress, setDemoAddress] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState<string | null>(null);
  const [metamaskAddress, setMetaMaskAddress] = useState<string | null>(null);
  const [metamaskChainId, setMetaMaskChainId] = useState<number>(MANTLE_SEPOLIA_CHAIN_ID);
  const [isConnecting, setIsConnecting] = useState(false);

  const effectiveAddress = isMetaMaskMode 
    ? metamaskAddress 
    : (isManualMode ? manualAddress : (isDemoMode ? demoAddress : connectedAddress ?? null));
  const effectiveChainId = useMemo(() => {
    if (isMetaMaskMode) return metamaskChainId;
    if (isDemoMode) return MANTLE_SEPOLIA_CHAIN_ID;
    if (typeof activeChainId === 'number') return activeChainId;
    if (typeof activeChainId === 'string') return Number(activeChainId);
    return MANTLE_SEPOLIA_CHAIN_ID;
  }, [activeChainId, isDemoMode, isMetaMaskMode, metamaskChainId]);

  const balance = balanceData ? formatEther(balanceData.value) : null;
  const isConnected = !!effectiveAddress && (wagmiConnected || isMetaMaskMode);

  // 更新 connector 名称
  useEffect(() => {
    if (isMetaMaskMode) {
      setWalletName('MetaMask (真实连接)');
      return;
    }
    
    if (isManualMode) {
      setWalletName('手动连接（只读）');
      return;
    }
    
    if (isDemoMode) {
      setWalletName('演示钱包');
      setDemoAddress(prev => prev ?? DEMO_ADDRESS);
      return;
    }

    if (connector?.name) {
      setWalletName(connector.name);
    } else {
      setWalletName(null);
    }
  }, [connector, isDemoMode, isManualMode, isMetaMaskMode]);

  // 初始化 MetaMask 连接器
  useEffect(() => {
    metamaskConnector.initialize().catch(error => {
      console.error('Failed to initialize MetaMask connector:', error);
    });

    // 监听 MetaMask 事件
    const handleConnected = (data: any) => {
      setIsMetaMaskMode(true);
      setMetaMaskAddress(data.address);
      setMetaMaskChainId(data.chainId);
      setWalletName('MetaMask (真实连接)');
    };

    const handleDisconnected = () => {
      setIsMetaMaskMode(false);
      setMetaMaskAddress(null);
      setWalletName(null);
    };

    metamaskConnector.on('connected', handleConnected);
    metamaskConnector.on('disconnected', handleDisconnected);
    metamaskConnector.on('session_restore', (session: any) => {
      try {
        const address = metamaskConnector.getAddress();
        const chainId = metamaskConnector.getChainId();
        setIsMetaMaskMode(true);
        setMetaMaskAddress(address);
        setMetaMaskChainId(chainId);
        setWalletName('MetaMask (真实连接)');
      } catch (error) {
        console.error('Failed to restore MetaMask session:', error);
      }
    });

    return () => {
      metamaskConnector.off('connected', handleConnected);
      metamaskConnector.off('disconnected', handleDisconnected);
    };
  }, []);

  const connectMetaMask = useCallback(async () => {
    setIsDemoMode(false);
    setIsManualMode(false);
    setIsMetaMaskMode(false);
    setDemoAddress(null);
    setManualAddress(null);
    setMetaMaskAddress(null);
    setWalletName(null);
    setIsConnecting(true);

    try {
      console.log('🔄 Connecting to MetaMask...');
      const result = await metamaskConnector.connect();
      
      setIsMetaMaskMode(true);
      setMetaMaskAddress(result.address);
      setMetaMaskChainId(result.chainId);
      setWalletName('MetaMask (真实连接)');
      
      Alert.alert(
        '连接成功！',
        `已连接到 MetaMask\n\n地址: ${result.address.slice(0, 6)}...${result.address.slice(-4)}\n\n您现在可以签名交易和发送交易了！`
      );
    } catch (error: any) {
      console.error('❌ MetaMask connection error:', error);
      Alert.alert('连接失败', error.message || '无法连接到 MetaMask，请重试');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsDemoMode(false);
    setIsManualMode(false);
    setDemoAddress(null);
    setManualAddress(null);
    setWalletName(null);
    setIsConnecting(true);
    try {
      await open();
    } catch (error) {
      console.error('❌ Web3Modal connect error:', error);
      Alert.alert('连接失败', '无法打开钱包连接界面,请重试');
    } finally {
      setIsConnecting(false);
    }
  }, [open]);

  const connectManual = useCallback((address: string) => {
    setIsDemoMode(false);
    setIsManualMode(true);
    setDemoAddress(null);
    setManualAddress(address);
    setWalletName('手动连接（只读）');
  }, []);

  const useDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setIsManualMode(false);
    setManualAddress(null);
    setDemoAddress(DEMO_ADDRESS);
  }, []);

  const disconnect = useCallback(async () => {
    setIsDemoMode(false);
    setIsManualMode(false);
    setIsMetaMaskMode(false);
    setDemoAddress(null);
    setManualAddress(null);
    setMetaMaskAddress(null);
    setWalletName(null);
    
    try {
      // 断开 MetaMask
      if (metamaskConnector.isConnected()) {
        await metamaskConnector.disconnect();
      }
      // 断开 Wagmi
      wagmiDisconnect();
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  }, [wagmiDisconnect]);

  const sendTransaction = useCallback(async (tx: any) => {
    if (!isMetaMaskMode) {
      throw new Error('只有 MetaMask 连接才能发送交易');
    }

    try {
      const txHash = await metamaskConnector.sendTransaction(tx);
      return txHash;
    } catch (error: any) {
      throw new Error(error.message || '交易失败');
    }
  }, [isMetaMaskMode]);

  const signMessage = useCallback(async (message: string) => {
    if (!isMetaMaskMode) {
      throw new Error('只有 MetaMask 连接才能签名');
    }

    try {
      const signature = await metamaskConnector.signMessage(message);
      return signature;
    } catch (error: any) {
      throw new Error(error.message || '签名失败');
    }
  }, [isMetaMaskMode]);

  const switchChain = useCallback(
    async (targetChainId: number) => {
      if (isDemoMode) {
        Alert.alert('演示模式', '演示模式无法切换网络,请连接真实钱包');
        return;
      }

      const target = APPKIT_NETWORKS.find(network => Number(network.id) === targetChainId);
      if (!target) {
        Alert.alert('提示', '暂不支持该网络');
        return;
      }

      try {
        wagmiSwitchNetwork?.(targetChainId);
      } catch (error: any) {
        console.error('❌ 切换网络失败:', error);
        const message = error?.message ?? '切换网络失败,请在钱包中手动选择 Mantle Sepolia';
        Alert.alert('切换失败', message);
      }
    },
    [isDemoMode, wagmiSwitchNetwork]
  );

  return (
    <WalletContext.Provider
      value={{
        address: effectiveAddress,
        isConnected,
        isConnecting,
        chainId: effectiveChainId,
        balance,
        walletName,
        isDemoMode,
        isManualMode,
        isMetaMaskMode,
        connect,
        connectMetaMask,
        connectManual,
        disconnect,
        switchChain,
        useDemoMode,
        sendTransaction,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}
