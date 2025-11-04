/**
 * MetaMask 真实连接服务
 * 使用 WalletConnect v2 + 深度链接实现移动端 MetaMask 连接
 */

import { Linking, Alert } from 'react-native';
import SignClient from '@walletconnect/sign-client';
import type { SessionTypes } from '@walletconnect/types';
import { initSignClient, REQUIRED_NAMESPACES, MANTLE_SEPOLIA_CHAIN_ID } from '../config/walletconnect';

export interface MetaMaskSession {
  session: SessionTypes.Struct;
  address: string;
  chainId: number;
}

class MetaMaskConnector {
  private client: InstanceType<typeof SignClient> | null = null;
  private session: SessionTypes.Struct | null = null;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * 初始化连接器
   */
  async initialize(): Promise<void> {
    if (this.client) {
      console.log('✅ MetaMask connector already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing MetaMask connector...');
      this.client = await initSignClient();
      this.setupEventListeners();
      await this.restoreSession();
      console.log('✅ MetaMask connector initialized');
    } catch (error) {
      console.error('❌ Failed to initialize MetaMask connector:', error);
      throw new Error('初始化失败，请检查网络连接');
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // 会话建立
    this.client.on('session_event', (event) => {
      console.log('📡 Session event:', event);
      this.emit('session_event', event);
    });

    // 会话更新
    this.client.on('session_update', ({ topic, params }) => {
      console.log('📡 Session updated:', topic, params);
      const session = this.client?.session.get(topic);
      if (session) {
        this.session = session;
        this.emit('session_update', session);
      }
    });

    // 会话删除
    this.client.on('session_delete', ({ topic }) => {
      console.log('📡 Session deleted:', topic);
      this.session = null;
      this.emit('session_delete', topic);
    });
  }

  /**
   * 恢复之前的会话
   */
  private async restoreSession(): Promise<void> {
    if (!this.client) return;

    try {
      const sessions = this.client.session.getAll();
      console.log('📋 Found sessions:', sessions.length);

      if (sessions.length > 0) {
        // 使用最新的会话
        this.session = sessions[sessions.length - 1];
        console.log('✅ Restored session:', this.session.topic);
        this.emit('session_restore', this.session);
      }
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
    }
  }

  /**
   * 连接 MetaMask
   */
  async connect(): Promise<MetaMaskSession> {
    if (!this.client) {
      await this.initialize();
    }

    if (!this.client) {
      throw new Error('SignClient 未初始化');
    }

    try {
      console.log('🔄 Starting MetaMask connection...');

      // 1. 创建连接提议
      const { uri, approval } = await this.client.connect({
        requiredNamespaces: REQUIRED_NAMESPACES,
      });

      if (!uri) {
        throw new Error('无法生成连接 URI');
      }

      console.log('✅ Connection URI generated');

      // 2. 打开 MetaMask 并传递 URI
      await this.openMetaMask(uri);

      // 3. 等待用户批准
      console.log('⏳ Waiting for user approval...');
      
      const session = await Promise.race([
        approval(),
        this.createTimeout(120000, '连接超时，请重试'),
      ]);

      this.session = session;
      console.log('✅ MetaMask connected successfully');

      // 4. 提取账户信息
      const address = this.getAddress();
      const chainId = this.getChainId();

      this.emit('connected', { session, address, chainId });

      return {
        session,
        address,
        chainId,
      };
    } catch (error: any) {
      console.error('❌ MetaMask connection failed:', error);
      
      // 清理失败的 pairing
      await this.cleanupFailedPairings();
      
      if (error.message?.includes('User rejected')) {
        throw new Error('用户拒绝了连接请求');
      } else if (error.message?.includes('timeout')) {
        throw new Error('连接超时，请确保 MetaMask 已安装并重试');
      } else {
        throw new Error(`连接失败: ${error.message || '未知错误'}`);
      }
    }
  }

  /**
   * 打开 MetaMask 并传递 WalletConnect URI
   */
  private async openMetaMask(uri: string): Promise<void> {
    try {
      // WalletConnect URI 格式: wc:xxxxx@2?relay-protocol=...
      const encodedUri = encodeURIComponent(uri);
      
      // 尝试多种深度链接方案
      const metamaskLinks = [
        // 标准 WalletConnect 深度链接
        `metamask://wc?uri=${encodedUri}`,
        // Universal Link (iOS)
        `https://metamask.app.link/wc?uri=${encodedUri}`,
      ];

      let opened = false;
      for (const link of metamaskLinks) {
        try {
          const canOpen = await Linking.canOpenURL(link);
          if (canOpen) {
            await Linking.openURL(link);
            console.log('✅ Opened MetaMask with:', link);
            opened = true;
            break;
          }
        } catch (e) {
          console.log('⚠️ Cannot open:', link);
        }
      }

      if (!opened) {
        // 如果无法打开，显示安装提示
        Alert.alert(
          '需要安装 MetaMask',
          '请先安装 MetaMask 移动应用\n\n1. 前往应用商店\n2. 搜索 "MetaMask"\n3. 安装并创建钱包\n4. 返回 ParkView 重新连接',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '前往安装',
              onPress: () => {
                Linking.openURL('https://metamask.io/download/');
              },
            },
          ]
        );
        throw new Error('MetaMask 未安装');
      }
    } catch (error) {
      console.error('❌ Failed to open MetaMask:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (!this.client || !this.session) {
      console.log('⚠️ No active session to disconnect');
      return;
    }

    try {
      console.log('🔄 Disconnecting MetaMask...');
      await this.client.disconnect({
        topic: this.session.topic,
        reason: {
          code: 6000,
          message: 'User disconnected',
        },
      });
      this.session = null;
      console.log('✅ MetaMask disconnected');
      this.emit('disconnected', null);
    } catch (error) {
      console.error('❌ Failed to disconnect:', error);
      throw error;
    }
  }

  /**
   * 发送交易
   */
  async sendTransaction(transaction: {
    from: string;
    to: string;
    data?: string;
    value?: string;
    gas?: string;
  }): Promise<string> {
    if (!this.client || !this.session) {
      throw new Error('未连接到 MetaMask');
    }

    try {
      console.log('🔄 Sending transaction...');
      
      const result = await this.client.request({
        topic: this.session.topic,
        chainId: `eip155:${MANTLE_SEPOLIA_CHAIN_ID}`,
        request: {
          method: 'eth_sendTransaction',
          params: [transaction],
        },
      });

      console.log('✅ Transaction sent:', result);
      return result as string;
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      throw new Error(`交易失败: ${error.message || '未知错误'}`);
    }
  }

  /**
   * 签名消息
   */
  async signMessage(message: string): Promise<string> {
    if (!this.client || !this.session) {
      throw new Error('未连接到 MetaMask');
    }

    try {
      console.log('🔄 Signing message...');
      
      const address = this.getAddress();
      const result = await this.client.request({
        topic: this.session.topic,
        chainId: `eip155:${MANTLE_SEPOLIA_CHAIN_ID}`,
        request: {
          method: 'personal_sign',
          params: [message, address],
        },
      });

      console.log('✅ Message signed');
      return result as string;
    } catch (error: any) {
      console.error('❌ Signing failed:', error);
      throw new Error(`签名失败: ${error.message || '未知错误'}`);
    }
  }

  /**
   * 获取当前地址
   */
  getAddress(): string {
    if (!this.session) {
      throw new Error('未连接');
    }

    const accounts = this.session.namespaces.eip155?.accounts || [];
    if (accounts.length === 0) {
      throw new Error('未找到账户');
    }

    // 格式: eip155:5003:0x123...
    const address = accounts[0].split(':')[2];
    return address;
  }

  /**
   * 获取当前链 ID
   */
  getChainId(): number {
    if (!this.session) {
      return MANTLE_SEPOLIA_CHAIN_ID;
    }

    const accounts = this.session.namespaces.eip155?.accounts || [];
    if (accounts.length === 0) {
      return MANTLE_SEPOLIA_CHAIN_ID;
    }

    // 格式: eip155:5003:0x123...
    const chainId = parseInt(accounts[0].split(':')[1], 10);
    return chainId;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.session !== null;
  }

  /**
   * 获取当前会话
   */
  getSession(): SessionTypes.Struct | null {
    return this.session;
  }

  /**
   * 清理失败的 pairing
   */
  private async cleanupFailedPairings(): Promise<void> {
    if (!this.client) return;

    try {
      const pairings = this.client.core.pairing.getPairings();
      for (const pairing of pairings) {
        if (!pairing.active) {
          await this.client.core.pairing.disconnect({ topic: pairing.topic });
          console.log('🗑️ Cleaned up inactive pairing:', pairing.topic);
        }
      }
    } catch (error) {
      console.error('⚠️ Failed to cleanup pairings:', error);
    }
  }

  /**
   * 创建超时 Promise
   */
  private createTimeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * 事件监听器
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }
}

// 导出单例
export const metamaskConnector = new MetaMaskConnector();
