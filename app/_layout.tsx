import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/Auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import "./global.css";
import { Ionicons } from '@expo/vector-icons';
import { icons } from '@/constants/icons';
import { supabase } from '@/lib/supabase';

import { Provider as PaperProvider } from 'react-native-paper';



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
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      
      {/* Daftarkan semua layar non-tab di sini */}
      <Stack.Screen name="post/[id]" options={{ title: 'Postingan' }} />
      
      <Stack.Screen name="chat/[id]" options={{ title: 'Percakapan' }} />
      <Stack.Screen name="search-users" options={{ title: 'Cari Pengguna', presentation: 'modal' }} />
      
    </Stack>
  );
};


// Komponen RootLayout utama yang membungkus semuanya
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}
