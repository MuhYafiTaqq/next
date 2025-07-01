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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const semesters = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
];

const CreateCourseScreen = () => {
  const { class_id } = useLocalSearchParams();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState(semesters[0]);
  const [loading, setLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Judul mata kuliah tidak boleh kosong.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('courses').insert({
      title,
      semester,
      class_id: Number(class_id),
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Gagal menambahkan mata kuliah: ' + error.message);
    } else {
      Alert.alert('Sukses', 'Mata kuliah berhasil ditambahkan.');
      router.back(); // atau bisa redirect ulang ke kelas
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <Stack.Screen options={{ title: 'Tambah Mata Kuliah' }} />

      <Text className="text-lg font-semibold mb-2">Nama Mata Kuliah</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Contoh: Aljabar Linear"
        className="bg-white p-4 rounded-lg text-base border border-gray-300"
      />

      <Text className="text-lg font-semibold mt-4 mb-2">Semester</Text>
      <View className="bg-white border border-gray-300 rounded-lg">
        {semesters.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSemester(s)}
            className={`p-4 border-b border-gray-100 ${
              semester === s ? 'bg-blue-100' : ''
            }`}
          >
            <Text className="text-base">{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleCreateCourse}
        className="bg-blue-500 p-4 rounded-lg items-center mt-8"
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Tambah</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CreateCourseScreen;
