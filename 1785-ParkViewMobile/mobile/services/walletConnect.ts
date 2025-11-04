/**
 * 简化版 WalletConnect 连接服务
 * 
 * 说明:
 * 1. 使用 WalletConnect v2 协议
 * 2. 生成连接 URI
 * 3. 通过深度链接传递给 MetaMask
 * 4. 监听连接状态获取地址
 * 
 * 但是! React Native 下完整的 WalletConnect 集成非常复杂:
 * - 需要 AsyncStorage 持久化
 * - 需要处理深度链接回调
 * - 需要处理签名请求
 * - 需要处理网络切换
 * 
 * 建议: 对于当前项目,演示模式已经足够测试所有功能
 */

import { Linking, Alert } from 'react-native';
import { PROJECT_ID } from '../config/walletconnect';

export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  error?: string;
}

/**
 * 连接到 MetaMask (简化版)
 * 
 * @param onConnected - 连接成功回调
 */
export async function connectToMetaMask(
  onConnected: (address: string) => void
): Promise<void> {
  try {
    console.log('🔗 准备连接 MetaMask...');

    // 方式 1: 使用 WalletConnect 深度链接
    // MetaMask 支持的深度链接格式:
    // metamask://wc?uri=wc:...
    
    // 方式 2: 直接打开 MetaMask
    const metamaskDeepLink = 'metamask://';
    
    const canOpen = await Linking.canOpenURL(metamaskDeepLink);
    
    if (!canOpen) {
      Alert.alert(
        '未安装 MetaMask',
        '请先从应用商店安装 MetaMask',
        [
          {
            text: '前往安装',
            onPress: () => Linking.openURL('https://metamask.io/download/')
          },
          { text: '取消', style: 'cancel' }
        ]
      );
      return;
    }

    // 打开 MetaMask
    await Linking.openURL(metamaskDeepLink);
    
    console.log('✅ MetaMask 已打开');
    
    // 显示说明
    Alert.alert(
      '下一步操作',
      '1. 在 MetaMask 中点击右上角菜单\n' +
      '2. 点击 "浏览器" (Browser)\n' +
      '3. 输入 dApp URL 或扫描二维码\n' +
      '4. 点击 "连接" 按钮\n\n' +
      '⚠️ 由于 React Native 限制,完整的 WalletConnect 集成较复杂\n\n' +
      '💡 建议: 使用"演示模式"测试所有功能',
      [
        { text: '了解', style: 'default' }
      ]
    );

  } catch (error: any) {
    console.error('❌ 连接失败:', error);
    Alert.alert('连接失败', error.message || '无法打开 MetaMask');
  }
}

/**
 * 生成 WalletConnect URI (理论实现)
 * 
 * 完整实现需要:
 * 1. @walletconnect/sign-client
 * 2. @react-native-async-storage/async-storage
 * 3. 深度链接处理
 * 4. 会话管理
 */
export async function generateWalletConnectURI(): Promise<string> {
  // 这需要完整的 SignClient 实现
  // 暂时返回示例 URI
  const exampleURI = `wc:abc123@2?relay-protocol=irn&symKey=xyz`;
  
  console.log('⚠️ generateWalletConnectURI: 需要完整的 SignClient 实现');
  
  return exampleURI;
}

/**
 * 使用 WalletConnect URI 连接 (理论实现)
 */
export async function connectWithURI(uri: string, walletDeepLink: string): Promise<void> {
  try {
    // 构建深度链接
    // MetaMask: metamask://wc?uri=wc:...
    // Trust: trust://wc?uri=wc:...
    const fullDeepLink = `${walletDeepLink}wc?uri=${encodeURIComponent(uri)}`;
    
    console.log('🔗 打开钱包:', fullDeepLink);
    
    await Linking.openURL(fullDeepLink);
    
  } catch (error) {
    console.error('❌ 连接失败:', error);
    throw error;
  }
}

/**
 * 完整的 WalletConnect 实现指南
 * 
 * 如果未来需要真正的 WalletConnect 集成,需要:
 * 
 * 1. 安装依赖:
 *    pnpm add @walletconnect/sign-client
 *    pnpm add @react-native-async-storage/async-storage
 * 
 * 2. 初始化 SignClient:
 *    const signClient = await SignClient.init({
 *      projectId: PROJECT_ID,
 *      metadata: {...},
 *      storage: AsyncStorage,
 *    });
 * 
 * 3. 创建会话:
 *    const { uri, approval } = await signClient.connect({
 *      requiredNamespaces: {
 *        eip155: {
 *          chains: ['eip155:5003'],
 *          methods: ['eth_sendTransaction', 'personal_sign'],
 *          events: ['chainChanged', 'accountsChanged'],
 *        },
 *      },
 *    });
 * 
 * 4. 打开钱包:
 *    Linking.openURL(`metamask://wc?uri=${uri}`);
 * 
 * 5. 等待批准:
 *    const session = await approval();
 *    const address = session.namespaces.eip155.accounts[0].split(':')[2];
 * 
 * 6. 监听事件:
 *    signClient.on('session_event', handler);
 *    signClient.on('session_update', handler);
 *    signClient.on('session_delete', handler);
 * 
 * 参考文档:
 * https://docs.reown.com/appkit/react-native/core/installation
 */

export const WALLET_CONNECT_GUIDE = `
完整 WalletConnect 集成步骤:

1. 安装必要依赖
2. 配置 AsyncStorage
3. 初始化 SignClient
4. 处理会话管理
5. 实现深度链接回调
6. 处理签名请求
7. 网络切换支持

当前状态: 演示模式已可满足开发测试需求
`;
