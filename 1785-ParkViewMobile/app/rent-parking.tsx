import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { useRentParkingSpot } from '@/mobile/hooks/useParkingContractViem';
import { formatEther, parseEther } from 'viem';
import { useLanguage } from '@/mobile/contexts/LanguageContext';

// 预设租用时长选项
const getDurationOptions = (t: (key: string) => string) => [
  { label: t('rentParking.duration1Day'), days: 1, popular: false },
  { label: t('rentParking.duration3Days'), days: 3, popular: true },
  { label: t('rentParking.duration7Days'), days: 7, popular: true },
  { label: t('rentParking.duration15Days'), days: 15, popular: false },
  { label: t('rentParking.duration30Days'), days: 30, popular: true },
];

export default function RentParkingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isConnected, address } = useWallet();
  const { rentParkingSpot, isPending } = useRentParkingSpot();
  const { t } = useLanguage();

  // 从路由参数获取车位信息
  const spotId = params.id as string;
  const spotName = params.name as string;
  const spotLocation = params.location as string;
  const spotPicture = params.picture as string;
  const spotRentPrice = params.rentPrice as string; // MNT
  const spotLatitude = params.latitude as string;
  const spotLongitude = params.longitude as string;
  const spotOwner = params.owner as string;

  const [selectedDuration, setSelectedDuration] = useState(3); // 默认3天
  const [totalCost, setTotalCost] = useState('0');
  
  const DURATION_OPTIONS = getDurationOptions(t);

  // 计算总费用
  useEffect(() => {
    if (spotRentPrice) {
      const cost = parseFloat(spotRentPrice) * selectedDuration;
      setTotalCost(cost.toFixed(4));
    }
  }, [selectedDuration, spotRentPrice]);

  // 处理租用
  const handleRent = async () => {
    if (!isConnected) {
      Alert.alert(t('common.tip'), t('wallet.connectFirst'));
      return;
    }

    if (address?.toLowerCase() === spotOwner?.toLowerCase()) {
      Alert.alert(t('common.tip'), t('rentParking.cannotRentOwn'));
      return;
    }

    Alert.alert(
      t('rentParking.confirmRent'),
      `${t('rentParking.spotLabel')}: ${spotName}\n${t('rentParking.durationLabel')}: ${selectedDuration} ${t('rentParking.days')}\n${t('rentParking.totalCost')}: ${totalCost} MNT\n\n${t('rentParking.confirmRentMessage')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('rentParking.confirmRentButton'),
          onPress: async () => {
            try {
              console.log('🚀 开始租用车位...');
              console.log('车位 ID:', spotId);
              console.log('租用天数:', selectedDuration);
              console.log('支付金额:', totalCost, 'MNT');

              // 计算租用结束时间 (当前时间 + 租用天数)
              const currentTime = Math.floor(Date.now() / 1000); // 当前时间戳(秒)
              const durationSeconds = BigInt(selectedDuration * 24 * 60 * 60); // 天数转秒
              const endTime = BigInt(currentTime) + durationSeconds;

              const hash = await rentParkingSpot(
                BigInt(spotId),
                endTime
              );

              console.log('✅ 租用成功! Hash:', hash);

              // 跳转到我的租赁页面
              router.replace('/(tabs)/my-rentals' as any);
            } catch (error: any) {
              console.error('❌ 租用失败:', error);
              Alert.alert(t('rentParking.rentFailed'), error.message || t('rentParking.rentFailedMessage'));
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('rentParking.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 车位信息卡片 */}
      <View style={styles.spotCard}>
        {spotPicture && (
          <Image
            source={{ uri: spotPicture }}
            style={styles.spotImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.spotInfo}>
          <Text style={styles.spotName}>{spotName}</Text>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#666" />
            <Text style={styles.spotLocation}>{spotLocation}</Text>
          </View>

          {spotLatitude && spotLongitude && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#666" />
              <Text style={styles.coordsText}>
                {Number(spotLatitude).toFixed(6)}, {Number(spotLongitude).toFixed(6)}
              </Text>
            </View>
          )}

          <View style={styles.priceCard}>
            <MaterialCommunityIcons name="cash" size={24} color="#2196F3" />
            <View style={styles.priceInfo}>
              <Text style={styles.priceLabel}>{t('rentParking.dailyRent')}</Text>
              <Text style={styles.priceValue}>{spotRentPrice} MNT</Text>
              <Text style={styles.priceSubtext}>
                {t('rentParking.cnyEquivalent', { amount: (parseFloat(spotRentPrice || '0') * 6.5).toFixed(2) })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 选择租期 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('rentParking.selectDuration')}</Text>
        
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.days}
              style={[
                styles.durationOption,
                selectedDuration === option.days && styles.durationOptionSelected,
              ]}
              onPress={() => setSelectedDuration(option.days)}
            >
              {option.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>{t('rentParking.popular')}</Text>
                </View>
              )}
              <Text
                style={[
                  styles.durationLabel,
                  selectedDuration === option.days && styles.durationLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 费用明细 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('rentParking.costDetails')}</Text>
        
        <View style={styles.costCard}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t('rentParking.unitPrice')}</Text>
            <Text style={styles.costValue}>{spotRentPrice} MNT/{t('rentParking.day')}</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t('rentParking.durationLabel')}</Text>
            <Text style={styles.costValue}>{selectedDuration} {t('rentParking.days')}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.costRow}>
            <Text style={styles.totalLabel}>{t('rentParking.totalCost')}</Text>
            <View style={styles.totalValue}>
              <Text style={styles.totalAmount}>{totalCost} MNT</Text>
              <Text style={styles.totalSubtext}>
                {t('rentParking.cnyEquivalent', { amount: (parseFloat(totalCost) * 6.5).toFixed(2) })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 租用说明 */}
      <View style={styles.section}>
        <View style={styles.tipBox}>
          <MaterialCommunityIcons name="information" size={20} color="#1890ff" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{t('rentParking.rentalInfo')}</Text>
            <Text style={styles.tipText}>• {t('rentParking.tip1')}</Text>
            <Text style={styles.tipText}>• {t('rentParking.tip2')}</Text>
            <Text style={styles.tipText}>• {t('rentParking.tip3')}</Text>
            <Text style={styles.tipText}>• {t('rentParking.tip4')}</Text>
          </View>
        </View>
      </View>

      {/* 租用按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.rentButton,
            (!isConnected || isPending) && styles.rentButtonDisabled,
          ]}
          onPress={handleRent}
          disabled={!isConnected || isPending}
        >
          {isPending ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.rentButtonText}>{t('rentParking.renting')}</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
              <Text style={styles.rentButtonText}>
                {isConnected ? `${t('rentParking.confirmRentButton')} ${totalCost} MNT` : t('wallet.connectFirst')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isPending}
        >
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  spotCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spotImage: {
    width: '100%',
    height: 200,
  },
  spotInfo: {
    padding: 16,
  },
  spotName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  spotLocation: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  coordsText: {
    fontSize: 12,
    color: '#999',
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginVertical: 2,
  },
  priceSubtext: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationOption: {
    flex: 0,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  durationOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  durationLabelSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  costCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  totalSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1890ff',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  rentButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
