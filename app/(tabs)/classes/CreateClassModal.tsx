import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';

interface CreateClassModalProps {
  isVisible: boolean;
  onClose: () => void;
  onClassCreated: () => void;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({ isVisible, onClose, onClassCreated }) => {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

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
      onClassCreated();
      onClose(); // Tutup modal setelah sukses
      setClassName('');
      setDescription('');
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      className='m-0 justify-center items-center'
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      useNativeDriver
    >
      <View
        className="bg-white rounded-xl w-[90%] p-6"
        style={{
          maxHeight: '90%',
        }}
      >
        <Text className="text-xl font-bold mb-4 text-center">Buat Kelas Baru</Text>

        <View>
          <Text className="text-lg font-semibold mb-2">Nama Kelas</Text>
          <TextInput
            value={className}
            onChangeText={setClassName}
            placeholder="Contoh: Teknik Informatika A"
            className="bg-white p-4 rounded-lg text-base border border-gray-300 mb-3"
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
        </View>

        <TouchableOpacity
          onPress={handleCreateClass}
          className="bg-primary p-4 rounded-lg items-center mt-8"
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Buat Kelas</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          className="bg-gray-200 p-4 rounded-lg items-center mt-2"
          disabled={loading}
        >
          <Text className="text-black font-bold text-lg">Batal</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default CreateClassModal;
