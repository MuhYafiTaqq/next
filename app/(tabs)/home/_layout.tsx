import { Stack, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { icons } from '@/constants/icons'; // Sesuaikan path jika berbeda
import { useAuth } from '@/context/Auth'; // Asumsi Anda punya AuthContext
import { supabase } from '@/lib/supabase'; // Asumsi ini adalah tempat fungsi logout Anda

export default function HomeStackLayout() {
  const { session, loading } = useAuth(); // Ambil session dan loading dari context
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  // Dapatkan username dari session
  const username = session?.user?.user_metadata?.username || 'Guest';
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);

  const handleLogout = async () => {
    setMenuVisible(false); // Sembunyikan menu segera
    try {
      await supabase.auth.signOut(); // Panggil fungsi logout dari Supabase
      // Jika Anda memiliki state user di AuthContext, set ke null
      // setUser(null); // uncomment jika ada setUser di useAuth
      router.replace('/auth'); // Redirect ke halaman login
    } catch (error) {
      console.error("Logout failed:", error);
      // Anda bisa menambahkan alert atau pesan error di sini
    }
  };

  if (loading) {
    // Jika auth sedang loading, Anda mungkin ingin menampilkan loading indicator
    // Atau pastikan komponen ini hanya dirender setelah loading selesai di InitialLayout
    return null; // Atau ActivityIndicator
  }

  return (
    <Stack>
      <Stack.Screen
        name="index" // Ini merujuk ke file 'index.jsx' di dalam folder 'index'
        options={{
          header: () => (
            <>
              <View className="flex-row justify-between items-center py-6 px-6 z-20 bg-white">
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setMenuVisible(!menuVisible); }} className="flex-row items-center">
                  <Image source={icons.user} className="w-12 h-12 rounded-full" />
                  <Text className="text-2xl font-bold text-gray-800 pl-4">Hi, {capitalizedUsername} 👋</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/chat')}>
                  <Ionicons name="chatbubble-ellipses" size={30} color="black" />
                </TouchableOpacity>
              </View>

              {/* Menu Logout */}
              {menuVisible && (
                <View className="absolute top-24 left-6 bg-white rounded-lg shadow-lg p-4 z-50">
                  <TouchableOpacity onPress={handleLogout} className="flex-row items-center">
                    <Ionicons name="log-out-outline" size={24} color="red" />
                    <Text className="text-red-500 font-bold ml-2 text-base">Logout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ),
          headerShown: true, // Pastikan header ini terlihat
          title: '', // Atau judul lain jika diperlukan
        }}
      />
      {/* Jika ada file lain di dalam app/(tabs)/index/ selain index.jsx,
          Anda bisa menambahkannya sebagai Stack.Screen di sini
          misalnya: <Stack.Screen name="detail" options={{ title: 'Detail Halaman' }} />
      */}
    </Stack>
  );
}