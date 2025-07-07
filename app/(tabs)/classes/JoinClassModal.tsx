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

interface JoinClassModalProps {
  isVisible: boolean;
  onClose: () => void;
  onClassJoined: () => void;
}

const JoinClassModal: React.FC<JoinClassModalProps> = ({ isVisible, onClose, onClassJoined }) => {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Kode gabung tidak boleh kosong.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('join_class_with_code', {
      p_join_code: joinCode.trim().toLowerCase(),
    });
    setLoading(false);

    if (error) {
      Alert.alert('Gagal Bergabung', error.message);
    } else if (data && data.error) {
      Alert.alert('Gagal Bergabung', data.error);
    } else if (data && data.success) {
      Alert.alert('Sukses', 'Anda berhasil bergabung dengan kelas!');
      onClassJoined();
      onClose();
      setJoinCode('');
    } else {
      Alert.alert('Gagal', 'Terjadi kesalahan yang tidak diketahui.');
    }
  };

  const handleClose = () => {
    onClose();
    setJoinCode(''); // Reset input saat modal ditutup
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
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
        <Text className="text-xl font-bold mb-4 text-center">Gabung Kelas</Text>

        <View>
          <Text className="text-lg font-semibold mb-2">Masukkan Kode Kelas</Text>
          <TextInput
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="Contoh: ab12cd"
            autoCapitalize="none"
            maxLength={6}
            className="bg-white p-4 rounded-lg border border-gray-300 text-center tracking-widest font-mono text-xl"
          />
        </View>

        <TouchableOpacity
          onPress={handleJoinClass}
          className="bg-primary p-4 rounded-lg items-center mt-8"
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Gabung Kelas</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClose}
          className="bg-gray-200 p-4 rounded-lg items-center mt-2"
          disabled={loading}
        >
          <Text className="text-black font-bold text-lg">Batal</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default JoinClassModal;
