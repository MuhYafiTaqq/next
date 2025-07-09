import { useEffect } from 'react';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/Auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import "./global.css";

import { Provider as PaperProvider } from 'react-native-paper';



// Komponen internal yang menangani logika redirect otomatis
const InitialLayout = () => {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/home');
      SplashScreen.hideAsync();
    } else if (!session && !inAuthGroup) {
      router.replace('/auth');
      SplashScreen.hideAsync();
    } else {
      SplashScreen.hideAsync();
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
      
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="search-users" options={{ title: 'Cari Pengguna', presentation: 'modal' }} />
      
      <Stack.Screen 
        name="gemini-assistant" 
        options={{ title: 'Teman Dengar' }} 
      />
      
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
