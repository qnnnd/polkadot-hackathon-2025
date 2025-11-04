import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/mobile/contexts/LanguageContext';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();

  const handleLanguageChange = () => {
    Alert.alert(
      t('settings.general.language'),
      t('settings.general.languageDesc'),
      [
        {
          text: t('languages.en'),
          onPress: () => setLocale('en'),
          style: locale === 'en' ? 'default' : 'cancel',
        },
        {
          text: t('languages.zh'),
          onPress: () => setLocale('zh'),
          style: locale === 'zh' ? 'default' : 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://parkview.app');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@parkview.app');
  };

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightText?: string,
    showChevron: boolean = true
  ) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <MaterialCommunityIcons name={icon as any} size={24} color="#007AFF" />
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}
      {showChevron && onPress && (
        <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 通用设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.general.title')}</Text>
          {renderMenuItem(
            'translate',
            t('settings.general.language'),
            t('settings.general.languageDesc'),
            handleLanguageChange,
            t(`languages.${locale}`)
          )}
          {renderMenuItem(
            'bell',
            t('settings.general.notifications'),
            t('settings.general.notificationsDesc'),
            () => Alert.alert(t('common.comingSoon'), 'Notifications settings coming soon')
          )}
          {renderMenuItem(
            'palette',
            t('settings.general.theme'),
            t('settings.general.themeDesc'),
            () => Alert.alert(t('common.comingSoon'), 'Theme settings coming soon'),
            t('profile.systemDefault')
          )}
        </View>

        {/* 安全与隐私 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.security.title')}</Text>
          {renderMenuItem(
            'shield-check',
            t('settings.security.walletSecurity'),
            t('settings.security.walletSecurityDesc'),
            () => Alert.alert(
              t('settings.security.walletSecurity'),
              'Your wallet connection is secured via WalletConnect protocol. Only approve transactions you trust.'
            )
          )}
          {renderMenuItem(
            'lock',
            t('settings.security.dataPrivacy'),
            t('settings.security.dataPrivacyDesc'),
            () => Alert.alert(
              t('settings.security.dataPrivacy'),
              'Your data is stored locally on your device. We do not collect or store your personal information on our servers.'
            )
          )}
        </View>

        {/* 帮助与支持 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.help.title')}</Text>
          {renderMenuItem(
            'book-open-variant',
            t('settings.help.documentation'),
            t('settings.help.documentationDesc'),
            () => Linking.openURL('https://docs.parkview.app')
          )}
          {renderMenuItem(
            'email',
            t('settings.help.contactSupport'),
            t('settings.help.contactSupportDesc'),
            handleContactSupport
          )}
          {renderMenuItem(
            'message-text',
            t('settings.help.feedback'),
            t('settings.help.feedbackDesc'),
            () => Linking.openURL('https://github.com/parkview/feedback')
          )}
        </View>

        {/* 关于 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about.title')}</Text>
          {renderMenuItem(
            'information',
            t('settings.about.version'),
            undefined,
            undefined,
            Constants.expoConfig?.version || '1.0.0',
            false
          )}
          {renderMenuItem(
            'web',
            t('settings.about.website'),
            undefined,
            handleOpenWebsite,
            'parkview.app'
          )}
          {renderMenuItem(
            'file-document',
            t('settings.about.terms'),
            undefined,
            () => Linking.openURL('https://parkview.app/terms')
          )}
          {renderMenuItem(
            'shield-account',
            t('settings.about.privacy'),
            undefined,
            () => Linking.openURL('https://parkview.app/privacy')
          )}
          {renderMenuItem(
            'license',
            t('settings.about.licenses'),
            undefined,
            () => Alert.alert('Open Source Licenses', 'Built with React Native, Expo, and other open source libraries.')
          )}
        </View>

        <Text style={styles.footer}>
          ParkView © 2024{'\n'}
          Blockchain-based parking rental platform
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  rightText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 32,
    lineHeight: 18,
  },
});
