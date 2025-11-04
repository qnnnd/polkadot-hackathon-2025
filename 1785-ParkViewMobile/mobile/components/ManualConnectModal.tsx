import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';

interface ManualConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
}

export default function ManualConnectModal({ visible, onClose, onConnect }: ManualConnectModalProps) {
  const [address, setAddress] = useState('');

  const handleConnect = () => {
    // 验证地址格式
    if (!address.startsWith('0x') || address.length !== 42) {
      Alert.alert('无效地址', '请输入有效的以太坊地址 (0x开头,42个字符)');
      return;
    }

    onConnect(address);
    setAddress('');
    onClose();
  };

  const pasteFromClipboard = async () => {
    try {
      // 这里需要导入 Clipboard
      // import Clipboard from '@react-native-clipboard/clipboard';
      // const text = await Clipboard.getString();
      // setAddress(text);
      Alert.alert('提示', '请从 MetaMask 复制你的地址并粘贴到输入框');
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>手动连接钱包</Text>
            <Text style={styles.subtitle}>输入你的钱包地址</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="0x..."
              placeholderTextColor="#8e8ea0"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>📱 如何获取地址:</Text>
            <Text style={styles.instructionText}>1. 打开 MetaMask App</Text>
            <Text style={styles.instructionText}>2. 点击账户名称复制地址</Text>
            <Text style={styles.instructionText}>3. 返回 ParkView 粘贴地址</Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity 
              style={styles.connectButton} 
              onPress={handleConnect}
              disabled={!address}
            >
              <Text style={styles.connectText}>连接</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warning}>
            <Text style={styles.warningText}>
              ⚠️ 注意: 只读模式,无法执行交易
            </Text>
            <Text style={styles.warningSubtext}>
              要执行交易,请使用 WalletConnect 或浏览器内 DApp
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8ea0',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'monospace',
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  instructions: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#8e8ea0',
    marginBottom: 6,
  },
  buttons: {
    gap: 12,
  },
  connectButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  connectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2c2c54',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e8ea0',
  },
  warning: {
    marginTop: 16,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 12,
    color: '#ffd93d',
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 10,
    color: '#8e8ea0',
    textAlign: 'center',
  },
});
