import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { useWallet } from '@/mobile/contexts/WalletContext';
import { useUpdateParkingSpot } from '@/mobile/hooks/useParkingContractViem';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EditParkingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isConnected, address } = useWallet();
  const { updateParkingSpot, isPending, isSuccess } = useUpdateParkingSpot();

  // 从路由参数获取车位信息
  const spotId = params.id as string;
  const initialName = params.name as string;
  const initialLocation = params.location as string;
  const initialRentPrice = params.rentPrice as string;
  const initialPicture = params.picture as string;
  const initialLatitude = parseFloat(params.latitude as string);
  const initialLongitude = parseFloat(params.longitude as string);

  // 表单状态
  const [name, setName] = useState(initialName || '');
  const [location, setLocation] = useState(initialLocation || '');
  const [rentPrice, setRentPrice] = useState(initialRentPrice || '');
  const [imageUri, setImageUri] = useState<string | null>(initialPicture || null);
  const [latitude, setLatitude] = useState<number | null>(initialLatitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude || null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(initialPicture || '');
  
  // 地图选点状态
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // 选择图片并上传
  const pickImage = async () => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7, // 压缩图片
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        
        // 上传图片到云存储
        await uploadImage(uri);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败,请重试');
    }
  };

  // 上传图片到 Cloudinary (免费云存储)
  const uploadImage = async (uri: string) => {
    try {
      setIsUploadingImage(true);

      // 准备表单数据
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'parking.jpg',
      } as any);
      formData.append('upload_preset', 'parkview'); // 需要在 Cloudinary 创建 unsigned upload preset
      
      // 上传到 Cloudinary (使用免费账户)
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dnhwzqcav/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        setUploadedImageUrl(data.secure_url);
        console.log('✅ 图片上传成功:', data.secure_url);
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      Alert.alert('上传失败', '图片上传失败,将使用原图片');
      // 保持原来的图片
      setUploadedImageUrl(initialPicture);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 打开地图选点
  const openMapPicker = () => {
    setShowMapPicker(true);
  };

  // 处理地图选点消息
  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'locationSelected') {
        const { latitude: lat, longitude: lng, address } = data;
        
        setLatitude(lat);
        setLongitude(lng);
        setLocation(address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setShowMapPicker(false);
        
        Alert.alert(
          '位置选择成功 ✅',
          `地址: ${address || '未知地址'}\n经度: ${lng.toFixed(6)}\n纬度: ${lat.toFixed(6)}`
        );
      }
    } catch (error) {
      console.error('处理地图消息失败:', error);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证表单
    if (!isConnected) {
      Alert.alert('提示', '请先连接钱包');
      return;
    }

    if (!name.trim()) {
      Alert.alert('提示', '请输入车位名称');
      return;
    }

    if (!location.trim()) {
      Alert.alert('提示', '请输入或获取位置信息');
      return;
    }

    if (!rentPrice || parseFloat(rentPrice) <= 0) {
      Alert.alert('提示', '请输入有效的租金价格 (必须大于 0)');
      return;
    }

    if (latitude === null || longitude === null) {
      Alert.alert('提示', '请点击"在地图上选择位置"按钮获取GPS坐标');
      return;
    }

    // 确认更新
    Alert.alert(
      '确认更新',
      `车位名称: ${name}\n位置: ${location}\n租金: ${rentPrice} MNT/天\n\n确定要更新这个车位吗?`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定更新',
          onPress: async () => {
            try {
              // 使用上传的图片 URL，如果没有新上传则使用原图
              const finalImageUrl = uploadedImageUrl || initialPicture;
              
              console.log('🔄 开始更新车位...');
              console.log('车位 ID:', spotId);
              console.log('图片 URL:', finalImageUrl);
              
              const hash = await updateParkingSpot(
                spotId,
                name.trim(),
                finalImageUrl,
                location.trim(),
                rentPrice,
                longitude,
                latitude
              );

              console.log('✅ 车位更新成功! Hash:', hash);
              
              Alert.alert(
                '更新成功! 🎉',
                '车位信息已成功更新',
                [
                  {
                    text: '确定',
                    onPress: () => router.push('/(tabs)/my-parking' as any)
                  }
                ]
              );
            } catch (error: any) {
              console.error('❌ 更新车位失败:', error);
              Alert.alert('更新失败', error.message || '更新车位失败,请重试');
            }
          }
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>编辑车位</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.walletInfo}>
            {isConnected ? (
              <>
                <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.walletText}>
                  {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#ff9800" />
                <Text style={styles.walletText}>未连接钱包</Text>
              </>
            )}
          </View>
          <View style={styles.spotIdBadge}>
            <MaterialCommunityIcons name="identifier" size={16} color="#666" />
            <Text style={styles.spotIdText}>车位 ID: #{spotId}</Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* 车位名称 */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="home" size={20} color="#666" />
              <Text style={styles.label}>车位名称</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="例如: 北京天安门停车位"
              value={name}
              onChangeText={setName}
              maxLength={50}
              placeholderTextColor="#999"
            />
            <Text style={styles.charCount}>{name.length}/50</Text>
          </View>

          {/* 位置 */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
              <Text style={styles.label}>位置</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={styles.locationInputContainer}>
              <Text style={[styles.input, styles.locationInput, !location && styles.locationPlaceholder]}>
                {location || '点击下方按钮在地图上选择位置'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={openMapPicker}
            >
              <MaterialCommunityIcons name="map-search" size={20} color="#fff" />
              <Text style={styles.locationButtonText}>
                {latitude && longitude ? '重新选择位置' : '在地图上选择位置'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* GPS 坐标显示 */}
          {latitude !== null && longitude !== null && (
            <View style={styles.coordsDisplay}>
              <MaterialCommunityIcons name="map-check" size={20} color="#4CAF50" />
              <Text style={styles.coordsText}>
                经度: {longitude.toFixed(6)} | 纬度: {latitude.toFixed(6)}
              </Text>
            </View>
          )}

          {/* 租金 */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="cash" size={20} color="#666" />
              <Text style={styles.label}>租金 (MNT/天)</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="例如: 0.01"
              value={rentPrice}
              onChangeText={setRentPrice}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
            {rentPrice && parseFloat(rentPrice) > 0 && (
              <Text style={styles.priceHint}>
                约 ¥{(parseFloat(rentPrice) * 6.5).toFixed(2)} 人民币/天
              </Text>
            )}
          </View>

          {/* 照片 */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="camera" size={20} color="#666" />
              <Text style={styles.label}>照片</Text>
              <Text style={styles.optional}>(可选)</Text>
            </View>
            <TouchableOpacity 
              style={styles.imagePickerButton} 
              onPress={pickImage}
              disabled={isUploadingImage}
            >
              {imageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  {isUploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator color="#fff" size="large" />
                      <Text style={styles.uploadingText}>上传中...</Text>
                    </View>
                  )}
                  {uploadedImageUrl && !isUploadingImage && (
                    <View style={styles.uploadedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                      <Text style={styles.uploadedText}>
                        {uploadedImageUrl === initialPicture ? '原图片' : '已上传'}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="image-plus" size={48} color="#999" />
                  <Text style={styles.imagePlaceholderText}>点击更换照片</Text>
                  <Text style={styles.imagePlaceholderSubtext}>推荐 16:9 比例</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 提交按钮 */}
          <TouchableOpacity
            style={[
              styles.submitButton, 
              (!isConnected || isPending || isUploadingImage) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isConnected || isPending || isUploadingImage}
          >
            {isPending ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}>更新中...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {isConnected ? '保存更新' : '请先连接钱包'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* 取消按钮 */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isPending || isUploadingImage}
          >
            <MaterialCommunityIcons name="close" size={20} color="#666" />
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        </View>

        {/* 提示信息 */}
        <View style={styles.tipBox}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={24} color="#ff9800" />
            <Text style={styles.tipTitle}>温馨提示</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>所有标记 * 的字段为必填项</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>如不更换图片，将保留原有图片</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>更新车位需要支付少量 Gas 费用</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>如果车位正在被租用，部分信息可能无法修改</Text>
          </View>
        </View>
      </ScrollView>

      {/* 地图选点模态框 */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        onRequestClose={() => setShowMapPicker(false)}
      >
        <View style={styles.mapModal}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>选择车位位置</Text>
            <TouchableOpacity
              style={styles.mapCloseButton}
              onPress={() => setShowMapPicker(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: generateMapPickerHtml(latitude || 39.9042, longitude || 116.4074) }}
            style={styles.mapWebView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onLoad={() => setMapLoaded(true)}
            onMessage={handleMapMessage}
          />

          <View style={styles.mapTip}>
            <MaterialCommunityIcons name="information" size={20} color="#1890ff" />
            <Text style={styles.mapTipText}>点击地图上任意位置选择车位坐标</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// 生成地图选点的 HTML (显示当前位置)
function generateMapPickerHtml(currentLat: number, currentLng: number) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; }
        html, body, #container { width: 100%; height: 100%; }
        .marker-label {
          background: #1890ff;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .current-marker-label {
          background: #4CAF50;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      </style>
      <script>
        window._AMapSecurityConfig = {
          securityJsCode: '85028c5f0b142a91791e073a16a9ef84'
        };
      </script>
      <script src="https://webapi.amap.com/maps?v=2.0&key=1250891f059d22237c930269df2b0633&plugin=AMap.Geocoder"></script>
    </head>
    <body>
      <div id="container"></div>
      <script>
        var map = new AMap.Map('container', {
          zoom: 15,
          center: [${currentLng}, ${currentLat}], // 当前车位位置
          viewMode: '3D'
        });

        var marker = null;
        var geocoder = new AMap.Geocoder();

        // 显示当前位置标记
        var currentMarker = new AMap.Marker({
          position: [${currentLng}, ${currentLat}],
          icon: new AMap.Icon({
            size: new AMap.Size(40, 50),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png',
            imageSize: new AMap.Size(40, 50)
          }),
          label: {
            content: '<div class="current-marker-label">📍 当前位置</div>',
            offset: new AMap.Pixel(0, -50)
          }
        });
        map.add(currentMarker);

        // 点击地图选择位置
        map.on('click', function(e) {
          var lng = e.lnglat.getLng();
          var lat = e.lnglat.getLat();
          
          console.log('地图点击:', lat, lng);

          // 移除旧标记（保留当前位置标记）
          if (marker) {
            map.remove(marker);
          }

          // 添加新标记
          marker = new AMap.Marker({
            position: [lng, lat],
            icon: new AMap.Icon({
              size: new AMap.Size(40, 50),
              image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
              imageSize: new AMap.Size(40, 50)
            }),
            label: {
              content: '<div class="marker-label">📍 新位置</div>',
              offset: new AMap.Pixel(0, -50)
            }
          });

          map.add(marker);

          // 逆地理编码获取地址
          geocoder.getAddress([lng, lat], function(status, result) {
            var address = '位置坐标';
            
            if (status === 'complete' && result.info === 'OK') {
              address = result.regeocode.formattedAddress;
            }

            // 发送消息到 React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'locationSelected',
              latitude: lat,
              longitude: lng,
              address: address
            }));

            console.log('选择的位置:', address, lat, lng);
          });
        });

        console.log('✅ 地图选点功能初始化完成');
      </script>
    </body>
    </html>
  `;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  walletText: {
    fontSize: 12,
    color: '#666',
  },
  spotIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  spotIdText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#ff4d4f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optional: {
    fontSize: 14,
    color: '#999',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    minHeight: 50,
  },
  locationInputContainer: {
    marginBottom: 8,
  },
  locationInput: {
    minHeight: 45,
    textAlignVertical: 'center',
  },
  locationPlaceholder: {
    color: '#999',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  coordsDisplay: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordsText: {
    fontSize: 14,
    color: '#2e7d32',
    flex: 1,
  },
  priceHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#ff9800',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
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
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  tipBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#856404',
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  // 地图选点模态框样式
  mapModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mapCloseButton: {
    padding: 4,
  },
  mapWebView: {
    flex: 1,
  },
  mapTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#e6f7ff',
    borderTopWidth: 1,
    borderTopColor: '#91d5ff',
  },
  mapTipText: {
    fontSize: 14,
    color: '#1890ff',
    flex: 1,
  },
});
