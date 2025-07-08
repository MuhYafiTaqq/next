import React from 'react';
import { Image, Pressable, StatusBar, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { icons } from '@/constants/icons';
import { StackActions } from '@react-navigation/native'; // <-- Pastikan ini diimpor

// Definisikan tipe untuk TabIcon props agar lebih aman
type TabIconProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
};

// Komponen helper untuk membuat ikon dengan indikator
const TabIcon = ({ iconName, color, focused }: TabIconProps) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {focused && (
        <View className='absolute h-8 w-20 rounded-full bg-blue-300/50 z-0'>

        </View>
      )
    }
    <Ionicons name={iconName} size={22} color="primary" />
    </View>
  );
};

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarButton: ({ children, style, onPress, onLongPress, accessibilityState }: any) => (
          <TouchableOpacity
            activeOpacity={1}
            onPress={onPress}
            onLongPress={typeof onLongPress === 'function' ? onLongPress : undefined}
            accessibilityState={accessibilityState}
            style={[style, { backgroundColor: 'transparent' }]}
          >
            {children}
          </TouchableOpacity>
        ),
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          paddingTop: 10,
          fontWeight: "bold",
        }
      }}
    >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                iconName={focused ? 'home' : 'home-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                iconName={focused ? 'newspaper' : 'newspaper-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="agenda"
          options={{
            title: 'Agenda',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                iconName={focused ? 'calendar' : 'calendar-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="classes"
          options={{
            title: 'Class',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                iconName={focused ? 'school' : 'school-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
    
        />

        <Tabs.Screen
          name="study-planner"
          options={{
            title: 'Study Planner',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                iconName={focused ? 'trail-sign' : 'trail-sign-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        
      </Tabs>
  );
};

export default TabLayout;
