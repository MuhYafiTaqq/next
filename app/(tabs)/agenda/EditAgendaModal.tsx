import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  // HAPUS 'Modal' dari baris import ini!
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator // <-- TAMBAHKAN INI
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Modal from 'react-native-modal'; // <-- Ini adalah import Modal yang BENAR yang harus digunakan
import { Ionicons } from '@expo/vector-icons';

// --- Interface Event (Pastikan ini SAMA PERSIS dengan yang di CourseDetailScreen.tsx dan SessionCard.tsx) ---
// Jika Anda sudah memindahkannya ke file types/index.ts, impor dari sana.
// Kalau tidak, pastikan definisi ini ada di sini dan di file lain yang menggunakan 'Event'.
interface Event {
  id: number;
  title: string;
  event_date: string; // YYYY-MM-DD
  color: string;
  location: string | null;
  time: string | null;
  user_id: string;
}

interface EditAgendaModalProps {
  visible: boolean;
  onClose: () => void;
  eventData: Event | null;
  onSave: (updatedEvent: Event) => void;
}

// Helper untuk parse string tanggal ke objek Date untuk picker
const parseDateToPickerFormat = (dateString: string | null | undefined): Date => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

// Helper untuk format objek Date ke string YYYY-MM-DD (untuk disimpan di DB)
const formatDateToDbString = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper untuk format tampilan tanggal yang user-friendly
const formatDisplayDate = (date: Date | null): string => {
  if (!date) return "Pilih Tanggal & Waktu";
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};


const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6'];

const EditAgendaModal: React.FC<EditAgendaModalProps> = ({ visible, onClose, eventData, onSave }) => {
  const [editedTitle, setEditedTitle] = useState(eventData?.title || '');
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(parseDateToPickerFormat(eventData?.event_date));
  const [editedColor, setEditedColor] = useState(eventData?.color || COLORS[0]);
  const [editedLocation, setEditedLocation] = useState(eventData?.location || '');
  const [editedTime, setEditedTime] = useState(eventData?.time || '');

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventData) {
      setEditedTitle(eventData.title || '');
      setSelectedEventDate(parseDateToPickerFormat(eventData.event_date));
      setEditedColor(eventData.color || COLORS[0]);
      setEditedLocation(eventData.location || '');
      setEditedTime(eventData.time || '');
    }
  }, [eventData]);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date: Date) => {
    setSelectedEventDate(date);
    hideDatePicker();
  };

  const handleSave = () => {
    if (!editedTitle.trim()) {
      Alert.alert("Error", "Judul acara tidak boleh kosong.");
      return;
    }
    setLoading(true);

    const updatedData: Event = {
      ...eventData!,
      title: editedTitle.trim(),
      event_date: selectedEventDate ? formatDateToDbString(selectedEventDate) : '',
      color: editedColor,
      location: editedLocation || null,
      time: editedTime || null,
    };
    onSave(updatedData);

    // setLoading(false) akan dipanggil oleh onSave di parent, setelah operasi DB selesai.
  };

  return (
    <Modal
      isVisible={visible} // <-- Sekarang prop isVisible seharusnya dikenali dengan benar
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
    >
      <View className="flex-1 justify-center items-center">
        <View className="bg-white p-6 rounded-lg w-full max-h-[80%]">
          <Text className="text-lg font-bold mb-4 text-center">Edit Acara</Text>

          <ScrollView className="w-full flex-grow">
            <Text className="text-sm font-semibold mt-2">Judul Acara</Text>
            <TextInput
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Judul Acara"
              className="border border-gray-300 rounded-lg p-3 my-2"
            />

            <Text className="text-sm font-semibold mt-2">Tanggal Acara:</Text>
            <TouchableOpacity onPress={showDatePicker} className="border border-gray-300 rounded-lg p-3 my-2 flex-row justify-between items-center">
              <Text className="text-base text-gray-700">
                {formatDisplayDate(selectedEventDate)}
              </Text>
              <Ionicons name="calendar-outline" size={24} color="gray" />
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={hideDatePicker}
              date={selectedEventDate || new Date()}
            />

            <Text className="text-sm font-semibold mt-2">Lokasi Acara:</Text>
            <TextInput
              value={editedLocation}
              onChangeText={setEditedLocation}
              placeholder="Contoh: Gedung A, Ruang 101"
              className="border border-gray-300 rounded-lg p-3 my-2"
            />

            <Text className="text-sm font-semibold mt-2">Jam Acara:</Text>
            <TextInput
              value={editedTime}
              onChangeText={setEditedTime}
              placeholder="Contoh: 10.00 - 12.00"
              className="border border-gray-300 rounded-lg p-3 my-2"
            />

            <Text className="text-sm font-semibold mt-2">Warna Acara:</Text>
            <View className="flex-row justify-around">
              {COLORS.map((c: string) => (
                <TouchableOpacity key={c} onPress={() => setEditedColor(c)} style={{ backgroundColor: c }} className="w-12 h-12 rounded-full justify-center items-center">
                  {editedColor === c && <Ionicons name="checkmark" size={24} color="white" />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={handleSave}
            className="bg-blue-500 p-3 rounded-lg mt-4 items-center w-full"
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Simpan Perubahan</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-200 p-3 rounded-lg mt-2 items-center w-full"
            disabled={loading}
          >
            <Text className="text-black font-bold">Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default EditAgendaModal;