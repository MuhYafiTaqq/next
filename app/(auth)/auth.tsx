import { View, Text, Image, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';

// Ganti dengan path logo Anda yang sebenarnya
import { icons } from '@/constants/icons';

const OnboardingScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 justify-center items-center px-6">
        
        {/* === Bagian Logo & Branding === */}
        <View className="items-center">
          <Image
            source={icons.logo}
            className="w-48 h-w-48"
            resizeMode="contain"
          />
          <Text className="text-4xl font-extrabold text-[#1F2937] mt-5">
            NextStudents
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center max-w-[80%]">
            Together We Plan Smarter, Learn Better, and Thrive Stronger.
          </Text>
        </View>
        
        {/* === Garis Pemisah === */}
        <View className="w-full h-[1px] bg-gray-200 my-12" />

        {/* === Bagian Tombol Aksi === */}
        <View className="w-full items-center">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')} // Arahkan ke halaman login
            className="w-full max-w-sm py-4 bg-white border border-gray-300 rounded-xl items-center"
            activeOpacity={0.7}
          >
            <Text className="text-base font-bold text-[#1F2937]">
              Log In !
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')} // Arahkan ke halaman register
            className="w-full max-w-sm py-4 bg-[#1F2937] rounded-xl items-center mt-4"
            activeOpacity={0.7}
          >
            <Text className="text-base font-bold text-white">
              Sign Up!
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;