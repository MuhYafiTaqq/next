import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';

interface CreatePostModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostModal = (props: CreatePostModalProps) => {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

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
    });
    setLoading(false);

    if (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Gagal mengirim postingan: " + error.message);
    } else {
      // Jika berhasil, kembali ke halaman sebelumnya (feed)
      props.onPostCreated();
      props.onClose();
    }
  };

  return (
    <Modal isVisible={props.isVisible} onBackdropPress={props.onClose} animationIn="slideInUp" animationOut="slideOutDown">
      <View className='bg-white p-4 rounded-xl'>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="justify-between"
        >
          {/* Kontainer untuk input teks */}
          <Text className='text-2xl font-bold mb-3'>Create New Post :</Text>
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

          {/* Tombol untuk membatalkan postingan */}
          <TouchableOpacity 
            onPress={props.onClose} 
            className="bg-red-500 p-4 rounded-lg items-center"
          >
            <Text className="text-white font-bold text-lg">Cancel</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default CreatePostModal;
