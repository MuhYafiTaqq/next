import { View, Text, Image, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';

import { images } from '@/constants/images';

// Ganti dengan path logo Anda yang sebenarnya

const OnboardingScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6">
        {/* === Bagian Logo & Branding === */}
        <View className="flex-1 justify-center items-center">
          <View className="items-center">
            <Image
              source={images.logo}
              className="w-48 h-48"
              resizeMode="contain"
            />
            <Text className="text-5xl font-extrabold text-primary mt-9">
              NextStudents
            </Text>
            <Text className="text-sm text-gray-500 mt-2 text-center max-w-[80%]">
              Together We Plan Smarter, Learn Better, and Thrive Stronger.
            </Text>
          </View>
        </View>

        {/* === Bagian Tombol Aksi === */}
        <View className="w-full mb-10">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            className="w-full py-5 bg-white border border-gray-300 rounded-xl items-center"
            activeOpacity={0.7}
          >
            <Text className="text-base font-bold text-primary">
              Log In !
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            className="w-full py-5 bg-primary rounded-xl items-center mt-4"
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