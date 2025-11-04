import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '@/mobile/contexts/LanguageContext';

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: '#8c8c8c',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
        headerStyle: {
          backgroundColor: '#1890ff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-rentals"
        options={{
          title: t('tabs.myRentals'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="car-key" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-parking"
        options={{
          title: t('tabs.myParkings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="garage" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
