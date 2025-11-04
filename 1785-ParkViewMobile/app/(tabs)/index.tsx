import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAllParkingSpots } from '@/mobile/hooks/useParkingContractViem';
import { formatEther } from 'viem';
import { useLanguage } from '@/mobile/contexts/LanguageContext';

/**
 * 地图总览页面
 * 从 Mantle Sepolia 链上获取所有车位并显示在地图上
 */
export default function MapScreen() {
  const { parkingSpots, isLoading, error, refetch } = useAllParkingSpots();
  const webViewRef = useRef<WebView>(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const { t } = useLanguage();
  const [region] = useState({
    latitude: 39.9042, // 北京天安门
    longitude: 116.4074,
  });

  useEffect(() => {
    if (error) {
      Alert.alert(t('common.loadFailed'), `${t('home.loadError')}: ${error.message}`);
    }
  }, [error, t]);

  // 当车位数据加载完成后,发送到 WebView
  useEffect(() => {
    if (parkingSpots.length > 0 && webViewRef.current && webViewLoaded) {
      const markers = parkingSpots.map((spot) => {
        // 处理图片 URL
        let pictureUrl = spot.picture;
        
        // 如果是相对路径 /tcw.jpg，使用占位图或默认图片
        if (pictureUrl === '/tcw.jpg' || !pictureUrl || pictureUrl.startsWith('/')) {
          // 使用免费的占位图服务
          pictureUrl = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=280&h=160&fit=crop';
          // 或者使用 placeholder
          // pictureUrl = 'https://via.placeholder.com/280x160/667eea/ffffff?text=🅿️+Parking';
        }
        
        return {
          id: spot.id.toString(),
          name: spot.name,
          location: spot.location,
          picture: pictureUrl, // 使用处理后的图片URL
          latitude: Number(spot.latitude) / 1000000,
          longitude: Number(spot.longitude) / 1000000,
          rentPrice: formatEther(spot.rent_price),
          isRented: spot.renter !== '0x0000000000000000000000000000000000000000',
          owner: spot.owner,
        };
      }).filter(m => m.latitude !== 0 && m.longitude !== 0);

      console.log('📍 准备发送标记数据:', markers.length, '个车位');
      console.log('📷 图片数据:', markers.map(m => ({ name: m.name, picture: m.picture || '无图片' })));

      // 发送标记数据到 WebView
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          if (window.updateMarkers) {
            window.updateMarkers(${JSON.stringify(markers)});
          } else {
            console.log('updateMarkers 函数未定义');
          }
          true;
        `);
      }, 500);
    }
  }, [parkingSpots, webViewLoaded]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>{t('home.loading')}</Text>
      </View>
    );
  }

  // 生成高德地图 HTML
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; }
        html, body, #container { width: 100%; height: 100%; }
      </style>
      <script>
        window._AMapSecurityConfig = {
          securityJsCode: '85028c5f0b142a91791e073a16a9ef84'
        };
      </script>
      <script src="https://webapi.amap.com/maps?v=2.0&key=1250891f059d22237c930269df2b0633"></script>
    </head>
    <body>
      <div id="container"></div>
      <script>
        var map = new AMap.Map('container', {
          zoom: 13,
          center: [${region.longitude}, ${region.latitude}],
          viewMode: '3D'
        });

        var markers = [];

        console.log('✅ 高德地图初始化完成');

        window.updateMarkers = function(data) {
          console.log('📍 收到标记数据:', data.length, '个车位');
          
          // 清除旧标记
          markers.forEach(m => map.remove(m));
          markers = [];

          // 添加新标记
          data.forEach(function(spot) {
            console.log('添加标记:', spot.name, spot.latitude, spot.longitude);
            
            var marker = new AMap.Marker({
              position: [spot.longitude, spot.latitude],
              title: spot.name,
              icon: new AMap.Icon({
                size: new AMap.Size(25, 34),
                image: spot.isRented 
                  ? 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
                  : 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
                imageSize: new AMap.Size(25, 34)
              })
            });

            // 创建包含图片的信息窗口内容
            var content = '<div style="padding: 0; width: 280px; font-family: Arial, sans-serif;">';
            
            // 如果有图片，显示图片
            if (spot.picture) {
              content += '<img src="' + spot.picture + '" style="width: 100%; height: 160px; object-fit: cover; display: block; border-radius: 8px 8px 0 0;" />';
            } else {
              content += '<div style="width: 100%; height: 160px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; border-radius: 8px 8px 0 0;"><span style="font-size: 48px;">🅿️</span></div>';
            }
            
            content += '<div style="padding: 12px;">' +
              '<h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #333;">' + spot.name + '</h3>' +
              '<p style="margin: 4px 0; font-size: 13px; color: #666;">📍 ' + spot.location + '</p>' +
              '<p style="margin: 8px 0; font-size: 15px; color: #1890ff; font-weight: 600;">💰 ' + spot.rentPrice + ' MNT/${t('home.day')}</p>' +
              '<p style="margin: 4px 0; font-size: 13px; font-weight: 600; color: ' + (spot.isRented ? '#f5222d' : '#52c41a') + ';">' + 
              (spot.isRented ? '🔴 ${t('home.rented')}' : '🟢 ${t('home.available')}') + '</p>' +
              '</div></div>';

            var infoWindow = new AMap.InfoWindow({
              content: content,
              offset: new AMap.Pixel(0, -30)
            });

            marker.on('click', function() {
              infoWindow.open(map, marker.getPosition());
            });

            markers.push(marker);
            map.add(marker);
          });

          // 自动缩放以显示所有标记
          if (data.length > 0) {
            map.setFitView(markers);
            console.log('✅ 已添加', markers.length, '个标记');
          }
        };
        
        console.log('✅ updateMarkers 函数已定义');
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoad={() => {
          console.log('🗺️ 高德地图 WebView 加载完成');
          setWebViewLoaded(true);
        }}
        onMessage={(event) => {
          console.log('WebView 消息:', event.nativeEvent.data);
        }}
      />

      {/* 信息栏 */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          📍 {t('home.chainSpotCount')}: {parkingSpots.length}
        </Text>
        <TouchableOpacity onPress={refetch} style={styles.refreshButton}>
          <Text style={styles.refreshText}>🔄 {t('home.refresh')}</Text>
        </TouchableOpacity>
      </View>

      {/* 如果没有车位数据 */}
      {!isLoading && parkingSpots.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            📭 {t('home.noSpotsOnChain')}
          </Text>
          <Text style={styles.emptySubtext}>
            {t('home.noSpotsMessage')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  map: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  callout: ViewStyle;
  calloutTitle: TextStyle;
  calloutText: TextStyle;
  calloutPrice: TextStyle;
  calloutStatus: TextStyle;
  infoBar: ViewStyle;
  infoText: TextStyle;
  refreshButton: ViewStyle;
  refreshText: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  emptySubtext: TextStyle;
}>({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  callout: {
    padding: 10,
    minWidth: 200,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  calloutPrice: {
    fontSize: 14,
    color: '#1890ff',
    fontWeight: '600',
    marginTop: 5,
  },
  calloutStatus: {
    fontSize: 12,
    marginTop: 5,
  },
  infoBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  refreshText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});
