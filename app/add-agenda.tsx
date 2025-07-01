import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6'];

const AddAgendaScreen = () => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [color, setColor] = useState(COLORS[0]);
  
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { session } = useAuth();
  const router = useRouter();

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios'); // Di iOS, picker tidak menutup otomatis
    setDate(currentDate);
  };

  const handleSave = async () => {
    if (!title.trim() || !session?.user) {
        Alert.alert("Error", "Judul acara tidak boleh kosong.");
        return;
    }

    setLoading(true);
    const { error } = await supabase
        .from('events')
        .insert({
            user_id: session.user.id,
            title: title.trim(),
            event_date: date.toISOString().split('T')[0], // Simpan hanya tanggal (YYYY-MM-DD)
            color: color,
        });
    
    setLoading(false);

    if (error) {
        Alert.alert("Error", "Gagal menyimpan acara: " + error.message);
    } else {
        router.back(); // Kembali ke halaman kalender
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
        <Stack.Screen options={{ title: 'Tambah Acara' }}/>
        <ScrollView className="p-4 space-y-4">
            <View>
                <Text className="text-lg font-semibold mb-2">Judul Acara</Text>
                <TextInput 
                    value={title} 
                    onChangeText={setTitle} 
                    className="bg-white p-4 rounded-lg text-base border border-gray-300" 
                    placeholder="Contoh: Ujian Akhir Semester"
                />
            </View>

            <View>
                <Text className="text-lg font-semibold mb-2">Tanggal</Text>
                <TouchableOpacity onPress={() => setShowPicker(true)} className="bg-white p-4 rounded-lg">
                    <Text className="text-base">{date.toLocaleDateString('id-ID', { dateStyle: 'full' })}</Text>
                </TouchableOpacity>
            </View>

            <View>
                <Text className="text-lg font-semibold mb-2">Pilih Warna</Text>
                <View className="flex-row justify-around">
                    {COLORS.map(c => (
                        <TouchableOpacity key={c} onPress={() => setColor(c)} style={{ backgroundColor: c }} className="w-12 h-12 rounded-full justify-center items-center">
                            {color === c && <Ionicons name="checkmark" size={24} color="white" />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            
            {showPicker && (
                <DateTimePicker 
                    value={date} 
                    mode="date"
                    display="default" 
                    onChange={onDateChange}
                />
            )}
            
            <TouchableOpacity onPress={handleSave} className="bg-blue-500 p-4 rounded-lg items-center mt-8" disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Simpan Acara</Text>}
            </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );
};

export default AddAgendaScreen;