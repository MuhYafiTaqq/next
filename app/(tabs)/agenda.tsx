import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';
import { Ionicons } from '@expo/vector-icons';

// Tipe untuk data event dari Supabase
interface Event {
  id: number;
  title: string;
  event_date: string;
  color: string;
}

// Tipe untuk objek yang akan digunakan untuk menandai kalender
interface MarkedDate {
  [date: string]: {
    dots: { key: string; color: string; }[];
    selected?: boolean;
    selectedColor?: string;
  };
}

const CalendarScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { session } = useAuth();

  // ✅ SOLUSI: Perbaiki struktur useFocusEffect untuk menangani fungsi async
  useFocusEffect(
    useCallback(() => {
      const fetchEvents = async () => {
        if (!session?.user) { 
          setLoading(false); 
          return; 
        }
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', session.user.id);
        
        if (error) Alert.alert('Error', 'Gagal memuat acara.');
        else setEvents(data || []);
        setLoading(false);
      };

      fetchEvents();
    }, [session])
  );

  // Format data event untuk ditampilkan sebagai titik di kalender
  const markedDates = useMemo(() => {
    const marks: MarkedDate = {};
    events.forEach(event => {
      const dateStr = event.event_date;
      if (!marks[dateStr]) {
        marks[dateStr] = { dots: [] };
      }
      marks[dateStr].dots.push({ key: event.id.toString(), color: event.color });
    });
    // Tandai juga tanggal yang sedang dipilih
    if (marks[selectedDate]) {
        marks[selectedDate].selected = true;
        marks[selectedDate].selectedColor = '#dbeafe'; // Warna biru muda
    } else {
        marks[selectedDate] = { dots: [], selected: true, selectedColor: '#dbeafe' };
    }
    return marks;
  }, [events, selectedDate]);

  // Filter event untuk ditampilkan di bawah kalender
  const eventsForSelectedDate = useMemo(() => {
    return events.filter(event => event.event_date === selectedDate);
  }, [events, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        markingType={'multi-dot'}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#00adf5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#00adf5',
          dayTextColor: '#2d4150',
          arrowColor: 'orange',
        }}
      />
      <View className="flex-1 p-4">
        <Text className="text-xl font-bold mb-2">Acara pada {new Date(selectedDate).toLocaleDateString('id-ID', {dateStyle: 'long'})}</Text>
        {loading ? <ActivityIndicator/> : (
            eventsForSelectedDate.length > 0 ? (
                eventsForSelectedDate.map(event => (
                    <View key={event.id} className="bg-white p-3 rounded-lg shadow-sm mb-2 flex-row items-center">
                       <View style={{width: 5, height: '100%', backgroundColor: event.color, marginRight: 10, borderRadius: 5}}/>
                       <Text className="text-base">{event.title}</Text>
                    </View>
                ))
            ) : (
                <Text className="text-gray-500">Tidak ada acara pada tanggal ini.</Text>
            )
        )}
      </View>

      {/* Tombol Tambah Acara */}
      <Link href="/add-agenda" asChild>
        <TouchableOpacity 
          className="absolute bottom-20 right-6 bg-blue-500 w-16 h-16 rounded-full justify-center items-center shadow-lg"
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
};

export default CalendarScreen;
