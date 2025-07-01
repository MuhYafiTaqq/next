// app/(auth)/_layout.tsx

import { Stack } from 'expo-router';

export default function AuthLayout() {
  // Navigator Stack ini hanya untuk mengelompokkan layar login dan register.
  // Kita sembunyikan headernya di sini agar semua layar di dalam grup (auth)
  // secara default tidak memiliki header.
  return <Stack screenOptions={{ headerShown: false }} />;
}