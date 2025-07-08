import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform, // Tetap diperlukan untuk Platform.OS
  ScrollView
} from 'react-native';
// Hapus Stack dan useRouter jika tidak digunakan
// import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; // Import DateTimePickerEvent
import { Ionicons } from '@expo/vector-icons';

import Modal from 'react-native-modal';


const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6'];

interface AddAgendaModalProps {
  onClose: () => void;
  onAgendaCreated: () => void;
  isVisible: boolean;
}

const AddAgendaModal = (props: AddAgendaModalProps) => {
  const { isVisible, onClose, onAgendaCreated } = props;
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date()); // Untuk Tanggal Acara
  const [color, setColor] = useState(COLORS[0]);
  const [location, setLocation] = useState('');
  // --- NEW STATE for Time Picker ---
  const [time, setTime] = useState(new Date()); // Untuk Jam Acara (objek Date)
  const [showTimePicker, setShowTimePicker] = useState(false); // Untuk kontrol time picker
  
  const [showDatePicker, setShowDatePicker] = useState(false); // Untuk kontrol date picker
  const [loading, setLoading] = useState(false);
  
  const { session } = useAuth();
  // const router = useRouter(); // Hapus ini jika tidak digunakan


  // --- Fungsi untuk mereset semua state form ---
  const resetForm = () => {
    setTitle('');
    setDate(new Date()); // Reset tanggal
    setTime(new Date()); // Reset jam
    setColor(COLORS[0]);
    setLocation('');
    setShowDatePicker(false); // Pastikan ini juga direset
    setShowTimePicker(false); // Reset time picker
    setLoading(false);
  };

  useEffect(() => {
    if (!isVisible) {
      resetForm();
    }
  }, [isVisible]);


  // Handler untuk DateTimePicker (Tanggal Acara)
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // --- NEW: Handler untuk DateTimePicker (Jam Acara) ---
  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios'); // Di iOS, picker tidak menutup otomatis
    setTime(currentTime);
  };

  const handleSave = async () => {
    if (!title.trim()) {
        Alert.alert("Error", "Judul acara tidak boleh kosong.");
        return;
    }
    if (!session?.user) {
        Alert.alert("Error", "Anda harus login untuk menyimpan acara.");
        return;
    }

    setLoading(true);

    // Format Jam Acara ke HH:MM (contoh: "14:30")
    const formattedTime = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const { error } = await supabase
        .from('events')
        .insert({
            user_id: session.user.id,
            title: title.trim(),
            event_date: date.toISOString().split('T')[0], // YYYY-MM-DD
            color: color,
            location: location || null,
            time: formattedTime || null, // --- NEW: Simpan waktu yang diformat ---
        });
    
    setLoading(false);

    if (error) {
        console.error("Error saving event:", error);
        Alert.alert("Error", "Gagal menyimpan acara: " + error.message);
    } else {
        Alert.alert("Sukses", "Acara berhasil ditambahkan!");
        onAgendaCreated();
        onClose();
    }
  };

  return (
    <Modal
        isVisible={isVisible}
        onBackButtonPress={onClose}
        onBackdropPress={onClose}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        animationInTiming={200}
        animationOutTiming={200}
        backdropOpacity={0.6}
        style={{ justifyContent: 'center', margin: 0 }}
    >
        <View className='bg-white mx-6 p-4'>
            <ScrollView>
                <Text className="text-xl font-bold mb-4 text-center">Tambah Acara Baru</Text>
                <View>
                    <Text className="text-lg font-semibold mb-2">Judul Acara</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        className="bg-white p-4 rounded-lg text-base border border-gray-300"
                        placeholder="Contoh: Ujian Akhir Semester"
                    />
                </View>

                <View className='mt-3'>
                    <Text className="text-lg font-semibold mb-2">Tanggal</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} className="bg-white p-4 rounded-lg border border-gray-300">
                        <Text className="text-base">{date.toLocaleDateString('id-ID', { dateStyle: 'full' })}</Text>
                    </TouchableOpacity>
                </View>

                <View className='mt-3'>
                    <Text className="text-lg font-semibold mb-2">Lokasi Acara</Text>
                    <TextInput
                        value={location}
                        onChangeText={setLocation}
                        className="bg-white p-4 rounded-lg text-base border border-gray-300"
                        placeholder="Contoh: Gedung A, Ruang 101"
                    />
                </View>

                {/* --- NEW INPUT: Jam Acara (dengan DateTimePicker) --- */}
                <View className='mt-3'>
                    <Text className="text-lg font-semibold mb-2">Jam Acara</Text>
                    <TouchableOpacity onPress={() => setShowTimePicker(true)} className="bg-white p-4 rounded-lg border border-gray-300">
                        <Text className="text-base">{time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>
                </View>

                <View className='mt-3'>
                    <Text className="text-lg font-semibold mb-2">Pilih Warna</Text>
                    <View className="flex-row justify-around">
                        {COLORS.map((c: string) => (
                            <TouchableOpacity key={c} onPress={() => setColor(c)} style={{ backgroundColor: c }} className="w-12 h-12 rounded-full justify-center items-center">
                                {color === c && <Ionicons name="checkmark" size={24} color="white" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                
                {showDatePicker && ( // DateTimePicker untuk Tanggal
                    <DateTimePicker
                        testID="datePicker"
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                {showTimePicker && ( // --- NEW: DateTimePicker untuk Jam ---
                    <DateTimePicker
                        testID="timePicker"
                        value={time}
                        mode="time" // Mode "time"
                        display="default"
                        onChange={onTimeChange}
                    />
                )}
                
                <TouchableOpacity onPress={handleSave} className="bg-blue-500 p-4 rounded-lg items-center mt-8" disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Simpan Acara</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} className="bg-gray-300 p-4 rounded-lg items-center mt-2" disabled={loading}>
                    <Text className="text-black font-bold text-lg">Batal</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    </Modal>
  );
};

export default AddAgendaModal;