import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CreatePostScreen = () => {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

  const handlePost = async () => {
    // Validasi dasar: pastikan konten tidak kosong
    if (!content.trim()) {
      Alert.alert("Error", "Cerita tidak boleh kosong!");
      return;
    }
    // Pastikan pengguna sudah login
    if (!session?.user) {
        Alert.alert("Error", "Anda harus login untuk membuat postingan.");
        return;
    }

    setLoading(true);
    // Masukkan data baru ke tabel 'posts'
    const { error } = await supabase.from('posts').insert({
      content: content.trim(),
      user_id: session.user.id,
      is_anonymous: isAnonymous,
      // Anda bisa tambahkan 'image_url' di sini jika ada fitur upload gambar
    });
    setLoading(false);

    if (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Gagal mengirim postingan: " + error.message);
    } else {
      // Jika berhasil, kembali ke halaman sebelumnya (feed)
      router.back(); 
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Opsi header ini akan menimpa yang ada di _layout.tsx jika perlu kustomisasi lebih */}
      <Stack.Screen 
        options={{ 
          title: "Ceritakan Sesuatu",
          // Tambahkan tombol batal di kiri header
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          )
        }} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 p-4 justify-between"
      >
        {/* Kontainer untuk input teks */}
        <View>
          <TextInput
            placeholder="Apa yang ingin kamu ceritakan hari ini?"
            multiline
            className="bg-white p-4 text-base rounded-lg h-48 border border-gray-200"
            style={{ textAlignVertical: 'top' }} // Agar teks dimulai dari atas di Android
            value={content}
            onChangeText={setContent}
            autoFocus={true}
          />
          
          {/* Opsi untuk posting sebagai anonim */}
          <View className="flex-row items-center justify-between my-5 p-4 bg-white rounded-lg border border-gray-200">
            <Text className="text-base text-gray-700">Post sebagai Anonim</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isAnonymous ? "#3b82f6" : "#f4f3f4"}
              onValueChange={setIsAnonymous}
              value={isAnonymous}
            />
          </View>
        </View>

        {/* Tombol untuk mengirim postingan */}
        <TouchableOpacity 
          onPress={handlePost} 
          className="bg-blue-500 p-4 rounded-lg items-center mb-4"
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Post</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;
