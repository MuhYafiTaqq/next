import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import komponen Menu dari React Native Paper
import { Menu, Divider } from 'react-native-paper'; // Divider untuk pemisah visual

// --- Import interface Event ---
// Jika Anda sudah memindahkan interface Event ke file types/index.ts,
// maka hapus definisi interface di bawah ini dan ganti dengan:
// import { Event } from '@/types/index'; // Sesuaikan path jika perlu
// Jika belum, biarkan definisi di bawah ini sampai Anda merefaktornya.
interface Event {
  id: number;
  title: string;
  event_date: string; // YYYY-MM-DD
  color: string;
  location: string | null;
  time: string | null;
  user_id: string; // Diperlukan untuk cek kepemilikan
}
// --- Akhir Import interface Event ---

interface AgendaItemProps {
  event: Event;
  isMyEvent: boolean; // Prop baru untuk indikasi kepemilikan
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
}

const AgendaItem: React.FC<AgendaItemProps> = ({ event, isMyEvent, onEdit, onDelete }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const confirmDelete = () => {
    closeMenu(); // Tutup menu sebelum alert
    Alert.alert(
      "Hapus Acara",
      `Apakah Anda yakin ingin menghapus "${event.title}"?`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: () => onDelete(event.id) },
      ]
    );
  };

  const handleEdit = () => {
    closeMenu(); // Tutup menu sebelum membuka modal edit
    onEdit(event); // Panggil fungsi onEdit dari parent
  };

  const formattedDateDisplay = new Date(event.event_date).toLocaleDateString('id-ID', {
    dateStyle: 'medium', // Contoh: 1 Jan 2025
  });

  return (
    <View className="bg-white p-4 rounded-lg shadow-sm mb-3 flex-row items-center border border-gray-200">
      {/* Indikator Warna */}
      <View
        style={{ backgroundColor: event.color }}
        className="w-2 h-8 rounded-full mr-4"
      />

      {/* Detail Acara */}
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-800" numberOfLines={1}>
          {event.title}
        </Text>
        {event.location && (
          <Text className="text-xs text-gray-600 mt-1">
            <Ionicons name="location-outline" size={12} color="gray" /> {event.location}
          </Text>
        )}
        {event.time && (
          <Text className="text-xs text-gray-600 mt-0.5">
            <Ionicons name="time-outline" size={12} color="gray" /> {event.time}
          </Text>
        )}
        <Text className="text-xs text-gray-500 mt-0.5">
          {formattedDateDisplay}
        </Text>
      </View>

      {/* Tombol Opsi (Dropdown Menu) */}
      <Menu
        visible={menuVisible}
        onDismiss={closeMenu}
        anchor={
          <TouchableOpacity onPress={openMenu} className="p-2 ml-2">
            <Ionicons name="ellipsis-vertical" size={20} color="gray" />
          </TouchableOpacity>
        }
      >
        {isMyEvent && ( // Hanya tampilkan jika ini acara pengguna sendiri
          <Menu.Item onPress={handleEdit} title="Edit Acara" />
        )}
        {isMyEvent && ( // Hanya tampilkan jika ini acara pengguna sendiri
          <Menu.Item onPress={confirmDelete} title="Hapus Acara" />
        )}
        {/* Opsional: Divider jika ada opsi lain yang tidak tergantung kepemilikan */}
        {/* <Divider /> */}
        {/* <MenuItem onPress={() => Alert.alert("Detail", "Melihat detail lebih lanjut.")} title="Lihat Detail" /> */}
      </Menu>
    </View>
  );
};

export default AgendaItem;