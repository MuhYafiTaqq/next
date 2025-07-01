import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const JoinClassScreen = () => {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Kode gabung tidak boleh kosong.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('join_class_with_code', {
      p_join_code: joinCode.trim().toLowerCase(), // Ubah ke huruf kecil untuk konsistensi
    });
    setLoading(false);

    if (error) {
      Alert.alert('Gagal Bergabung', error.message);
    } else if (data && data.error) {
      Alert.alert('Gagal Bergabung', data.error);
    } else if (data && data.success) {
      Alert.alert('Sukses', 'Anda berhasil bergabung dengan kelas!');
      router.replace(`/(tabs)/classes`);
    } else {
      Alert.alert('Gagal', 'Terjadi kesalahan yang tidak diketahui.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <Stack.Screen options={{ title: 'Gabung dengan Kode' }} />
      <Text className="text-lg font-semibold mb-2">Masukkan Kode Kelas</Text>
      <TextInput
        value={joinCode}
        onChangeText={setJoinCode}
        placeholder="Contoh: ab12cd"
        autoCapitalize="none"
        maxLength={6}
        // ✅ SOLUSI: Hapus 'text-base' yang konflik dengan 'text-xl'
        className="bg-white p-4 rounded-lg border border-gray-300 text-center tracking-widest font-mono text-xl"
      />
      <TouchableOpacity
        onPress={handleJoinClass}
        className="bg-blue-500 p-4 rounded-lg items-center mt-8"
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Gabung Kelas</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default JoinClassScreen;