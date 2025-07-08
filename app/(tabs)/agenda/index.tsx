import React, { useState, useMemo, useCallback } from 'react'; // Pastikan useCallback diimpor
import { View, Text, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';
import { Ionicons } from '@expo/vector-icons';

import Modal from 'react-native-modal';
import AddAgendaModal from './AddAgendaModal';
import EditAgendaModal from './EditAgendaModal';
import AgendaItem from './AgendaItem';


// --- Interface Event (pastikan ini sama persis di semua file) ---
export interface Event {
  id: number;
  title: string;
  event_date: string; // ISO 8601YYYY-MM-DD
  color: string;
  location: string | null;
  time: string | null;
  user_id: string; // <-- PENTING: ID pengguna pemilik acara
}

// --- Interface MarkedDate (sudah benar) ---
export interface MarkedDate {
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

  const [modalAdd, setModalAdd] = useState(false);
  const [isEditAgendaModalVisible, setIsEditAgendaModalVisible] = useState(false);
  const [currentEventToEdit, setCurrentEventToEdit] = useState<Event | null>(null);


  const fetchEvents = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', session.user.id)
      .order('event_date', { ascending: true })
      .order('time', { ascending: true })
      .order('title', { ascending: true });

    if (error) {
        console.error('Supabase fetchEvents Error:', error);
        Alert.alert('Error', 'Gagal memuat acara: ' + error.message);
    } else {
        setEvents(data || []);
    }
    setLoading(false);
  }, [session?.user?.id]); // Dependensi adalah session?.user?.id


  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]) // Dependensi adalah fungsi fetchEvents itu sendiri
  );

  const markedDates = useMemo(() => {
    const marks: MarkedDate = {};
    events.forEach(event => {
      const dateStr = event.event_date;
      if (!marks[dateStr]) {
        marks[dateStr] = { dots: [] };
      }
      marks[dateStr].dots.push({ key: event.id.toString(), color: event.color });
    });
    if (marks[selectedDate]) {
        marks[selectedDate].selected = true;
        marks[selectedDate].selectedColor = '#dbeafe';
    } else {
        marks[selectedDate] = { dots: [], selected: true, selectedColor: '#dbeafe' };
    }
    return marks;
  }, [events, selectedDate]);

  const eventsForSelectedDate = useMemo(() => {
    return events.filter(event => event.event_date === selectedDate);
  }, [events, selectedDate]);

  const onDayPress = useCallback((day: DateData) => { // Bungkus dengan useCallback
    setSelectedDate(day.dateString);
  }, []); // Tidak ada dependensi karena setSelectedDate stabil


  // --- PERBAIKAN: Handlers dengan useCallback dan dependensi yang benar ---
  const handleEditAgenda = useCallback((eventToEdit: Event) => {
    setCurrentEventToEdit(eventToEdit);
    setIsEditAgendaModalVisible(true);
  }, []); // Tidak ada dependensi karena setCurrentEventToEdit dan setIsEditAgendaModalVisible stabil

  const handleSaveEditedAgenda = useCallback(async (updatedEvent: Event) => {
    const { id, user_id, ...updates } = updatedEvent;
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error("Error updating event:", error); // Log error
      Alert.alert("Error", `Gagal memperbarui acara: ${error.message}`);
    } else {
      Alert.alert("Sukses", "Acara berhasil diperbarui.");
      setIsEditAgendaModalVisible(false);
      fetchEvents(); // Muat ulang acara setelah update
    }
  }, [supabase, fetchEvents]); // Dependensi: supabase dan fetchEvents

  const handleDeleteAgenda = useCallback(async (eventId: number) => {
    Alert.alert(
      "Hapus Acara",
      "Apakah Anda yakin ingin menghapus acara ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from('events')
              .delete()
              .eq('id', eventId);

            if (error) {
              console.error("Error deleting event:", error); // Log error
              Alert.alert("Error", `Gagal menghapus acara: ${error.message}`);
            } else {
              Alert.alert("Sukses", "Acara berhasil dihapus.");
              fetchEvents(); // Muat ulang acara setelah hapus
            }
          },
        },
      ]
    );
  }, [supabase, fetchEvents]); // Dependensi: supabase dan fetchEvents
  // --- AKHIR PERBAIKAN HANDLERS ---


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
                    <AgendaItem
                        key={event.id}
                        event={event}
                        isMyEvent={session?.user?.id === event.user_id}
                        onEdit={handleEditAgenda}
                        onDelete={handleDeleteAgenda}
                    />
                ))
            ) : (
                <Text className="text-gray-500">Tidak ada acara pada tanggal ini.</Text>
            )
        )}
      </View>

      <TouchableOpacity
        className="absolute bottom-20 right-6 bg-blue-500 w-16 h-16 rounded-full justify-center items-center shadow-lg"
        onPress={() => setModalAdd(true)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <AddAgendaModal
        isVisible={modalAdd}
        onClose={() => setModalAdd(false)}
        onAgendaCreated={() => {
          setModalAdd(false);
          fetchEvents();
        }}
      />

      {isEditAgendaModalVisible && currentEventToEdit && (
        <EditAgendaModal
          visible={isEditAgendaModalVisible}
          onClose={() => setIsEditAgendaModalVisible(false)}
          eventData={currentEventToEdit}
          onSave={handleSaveEditedAgenda}
        />
      )}
    </SafeAreaView>
  );
};

export default CalendarScreen;