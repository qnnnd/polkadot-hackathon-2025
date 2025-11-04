import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { useLanguage } from '@/mobile/contexts/LanguageContext';
import { useRouter } from 'expo-router';

/**
 * 个人中心页面
 */
export default function ProfileScreen() {
  const {
    address,
    balance,
    isConnected,
    isConnecting,
    isInitialized,
    connect,
    disconnect,
    chainId,
  } = useWallet();
  const { t } = useLanguage();
  const router = useRouter();

  const formattedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const formattedBalance = balance ? parseFloat(balance).toFixed(4) : null;

  // 获取链名称
  const getChainName = (id: number) => {
    switch (id) {
      case 5003: return 'Mantle Sepolia';
      case 11155111: return 'Ethereum Sepolia';
      default: return `Chain ${id}`;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 钱包状态卡片 */}
      <View style={styles.walletCard}>
        {!isConnected ? (
          <>
            <MaterialCommunityIcons name="wallet-outline" size={64} color="#999" />
            <Text style={styles.walletTitle}>{t('wallet.notConnected')}</Text>
            <Text style={styles.walletSubtitle}>{t('wallet.connectPrompt')}</Text>
            
            <TouchableOpacity
              style={[
                styles.connectButton,
                (!isInitialized || isConnecting) && styles.connectButtonDisabled
              ]}
              onPress={connect}
              disabled={!isInitialized || isConnecting}
            >
              {!isInitialized ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.connectButtonText}>{t('wallet.initializing')}</Text>
                </>
              ) : isConnecting ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.connectButtonText}>{t('wallet.connecting')}</Text>
                </>
              ) : (
                <Text style={styles.connectButtonText}>{t('wallet.connectMetaMask')}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.helpText}>
              {t('wallet.ensureMetaMask')}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>{t('wallet.connected')}</Text>
            </View>

            <Text style={styles.address}>{formattedAddress}</Text>
            
            {formattedBalance && (
              <Text style={styles.balance}>{formattedBalance} MNT</Text>
            )}
            
            <Text style={styles.chainInfo}>
              🔗 {getChainName(chainId)}
            </Text>

            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={disconnect}
            >
              <Text style={styles.disconnectButtonText}>{t('wallet.disconnect')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 功能菜单 */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <MaterialCommunityIcons name="cog" size={24} color="#007AFF" />
          <Text style={styles.menuTitle}>{t('profile.general')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <MaterialCommunityIcons name="shield-check" size={24} color="#007AFF" />
          <Text style={styles.menuTitle}>{t('profile.security')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <MaterialCommunityIcons name="help-circle" size={24} color="#007AFF" />
          <Text style={styles.menuTitle}>{t('profile.help')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  walletCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  walletTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  walletSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    minWidth: 200,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  connectButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  connectedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  connectedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  address: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  balance: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  chainInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
