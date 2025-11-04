import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface WalletConnectQRModalProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

export function WalletConnectQRModal({ visible, uri, onClose }: WalletConnectQRModalProps) {
  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>扫描二维码连接钱包</Text>
            <Text style={styles.subtitle}>
              使用 MetaMask 或其他支持 WalletConnect 的钱包扫描此二维码
            </Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={uri}
                size={280}
                backgroundColor="white"
                color="black"
              />
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>📱 如何连接：</Text>
              <Text style={styles.instructionText}>
                1. 打开 MetaMask 钱包 App{'\n'}
                2. 点击顶部的扫描图标{'\n'}
                3. 扫描上方二维码{'\n'}
                4. 在 MetaMask 中批准连接请求
              </Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>关闭</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructions: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
