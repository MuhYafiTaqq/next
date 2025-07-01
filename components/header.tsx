import React from 'react';
import { View, Text, Image } from 'react-native';
import { icons } from '@/constants/icons';

type HeaderGreetingProps = {
  title?: string;
  username?: string;
};

const HeaderGreeting: React.FC<HeaderGreetingProps> = ({ title, username }) => {
  const capitalized = username ? username.charAt(0).toUpperCase() + username.slice(1) : 'Guest';

  return (
    <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center">
      <Image source={icons.user} className="w-12 h-12 rounded-full mr-4" />
      <View>
        {title && <Text className="text-xs text-gray-500">{title}</Text>}
        <Text className="text-xl font-bold text-gray-800">Hi, {capitalized} 👋</Text>
      </View>
    </View>
  );
};

export default HeaderGreeting;
