import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const CreateClassScreen = () => {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateClass = async () => {
    if (!className.trim()) {
      Alert.alert('Error', 'Nama kelas tidak boleh kosong.');
      return;
    }

    setLoading(true);

    const { data: newClassId, error } = await supabase.rpc('create_new_class', {
      class_name: className,
      class_description: description,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Gagal membuat kelas: ' + error.message);
    } else {
      Alert.alert('Sukses', 'Kelas berhasil dibuat!');
      router.replace({
        pathname: `/classes`,
        params: { id: newClassId },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <Stack.Screen options={{ title: 'Buat Kelas' }} />

      <Text className="text-lg font-semibold mb-2">Nama Kelas</Text>
      <TextInput
        value={className}
        onChangeText={setClassName}
        placeholder="Contoh: Teknik Informatika A"
        className="bg-white p-4 rounded-lg text-base border border-gray-300"
      />

      <Text className="text-lg font-semibold mt-4 mb-2">Deskripsi (Opsional)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Deskripsi kelas"
        multiline
        className="bg-white p-4 rounded-lg text-base h-24 border border-gray-300"
        style={{ textAlignVertical: 'top' }}
      />

      <TouchableOpacity
        onPress={handleCreateClass}
        className="bg-blue-500 p-4 rounded-lg items-center mt-8"
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Buat Kelas</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CreateClassScreen;
