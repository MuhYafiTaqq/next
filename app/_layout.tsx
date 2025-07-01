import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/Auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import "./global.css";
import { Ionicons } from '@expo/vector-icons';
import { icons } from '@/constants/icons';
import { supabase } from '@/lib/supabase';


// Komponen internal yang menangani logika redirect otomatis
const InitialLayout = () => {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

    const [menuVisible, setMenuVisible] = useState(false);
  const username = session?.user?.user_metadata?.username || 'Guest';
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);


  const handleLogout = async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/home');
    } else if (!session && !inAuthGroup) {
      router.replace('/auth');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Setelah selesai loading, tampilkan navigator utama
  return (
    <Stack>
      {/* Grup rute utama */}
      <Stack.Screen name="(tabs)" options={{ header: () => (
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
      ) }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      
      {/* Daftarkan semua layar non-tab di sini */}
      <Stack.Screen name="post/[id]" options={{ title: 'Postingan' }} />
      <Stack.Screen name="create-post" options={{ title: 'Buat Postingan Baru', presentation: 'modal' }} />
      
      <Stack.Screen name="chat/[id]" options={{ title: 'Percakapan' }} />
      <Stack.Screen name="search-users" options={{ title: 'Cari Pengguna', presentation: 'modal' }} />
      
      {/* ✅ TAMBAHKAN SCREEN BARU UNTUK FITUR KELAS DI SINI */}
      <Stack.Screen name="course/[id]" options={{ title: 'Detail Mata Kuliah' }} />
      <Stack.Screen 
        name="create-class" 
        options={{ title: 'Buat Kelas Baru', presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="create-course" 
        options={{ title: 'Tambah Mata Kuliah', presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="add-agenda" 
        options={{ title: 'Tambah Agenda', presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="create-session" 
        options={{ title: 'Tambah Sesi Baru', presentation: 'modal' }} 
      />
      
    </Stack>
  );
};


// Komponen RootLayout utama yang membungkus semuanya
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
