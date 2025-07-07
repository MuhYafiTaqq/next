import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

// Tipe data untuk sesi yang diterima sebagai prop
interface SessionData {
  id: number;
  session_date: string | null; // <-- PERBAIKAN: Pastikan ini string | null
  topic: string;
  assignment_details: string | null;
  assignment_deadline: string | null;
  material_link: string | null;
  photo_link: string | null;
  youtube_link: string | null;
}

// Tipe untuk semua props yang diterima komponen ini
interface SessionCardProps {
  session: SessionData;
  index: number;
  userRole: string;
  onDelete: (sessionId: number) => void;
  onEdit: (session: SessionData) => void;
}

const SessionCard = ({ session, index, userRole, onDelete, onEdit }: SessionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const openLink = (url: string | null) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert("Error", "Tidak bisa membuka link."));
    } else {
      Alert.alert("Info", "Tidak ada link yang tersedia.");
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Hapus Sesi",
      `Apakah Anda yakin ingin menghapus "${session.topic}"?`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: () => onDelete(session.id) },
      ]
    );
  };

  // <-- PERBAIKAN: Pastikan session.session_date selalu string atau objek Date untuk new Date()
  // Gunakan '|| new Date()' sebagai fallback jika data benar-benar undefined/null
  // Meskipun interface mengatakan string | null, kadang data dari API bisa undefined.
  const dateToFormat = session?.session_date ? new Date(session.session_date) : new Date();
  const formattedDate = dateToFormat.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View className="bg-white mx-4 mb-3 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Kartu yang Selalu Terlihat */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        className="p-4 flex-row justify-between items-center"
        activeOpacity={0.8}
      >
        <View className="flex-1">
          <Text className="text-xs text-primary/60">{formattedDate}</Text>
          <Text className="text-lg font-bold text-gray-800 mt-1" numberOfLines={2}>{session.topic}</Text>
        </View>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="gray" />
      </TouchableOpacity>

      {/* Bagian Detail yang Bisa Di-expand/collapse */}
      {isExpanded && (
        <View className="px-4 pb-4 border-t border-gray-100">

          {/* Bagian Tugas */}
          {session.assignment_details ? (
            <View className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-400 rounded-lg">
              <Text className="font-bold text-base text-yellow-800">Tugas:</Text>
              <Text className="text-gray-800 mt-1">{session.assignment_details}</Text>
              {session.assignment_deadline && (
                <Text className="text-sm text-red-600 font-semibold mt-2">
                  Deadline: {new Date(session.assignment_deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
              )}
            </View>
          ) : (
            <Text className="mt-4 text-sm text-gray-500 italic">Tidak ada tugas pada sesi ini.</Text>
          )}

          {/* Bagian Link Materi */}
          <Text className="font-bold text-base mt-4 pt-3 border-t border-gray-100">Materi Pendukung:</Text>
          <View className="flex-row justify-around mt-3">
            <TouchableOpacity onPress={() => openLink(session.material_link)} className="items-center p-2">
              <Ionicons name="document-text-outline" size={28} color="#3b82f6"/>
              <Text className="text-xs mt-1">Materi</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink(session.photo_link)} className="items-center p-2">
              <Ionicons name="camera-outline" size={28} color="#3b82f6"/>
              <Text className="text-xs mt-1">Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink(session.youtube_link)} className="items-center p-2">
              <Ionicons name="logo-youtube" size={28} color="#ff0000"/>
              <Text className="text-xs mt-1">Video</Text>
            </TouchableOpacity>
          </View>

          {/* Tombol Aksi untuk Admin */}
          {userRole === 'admin' && (
            <View className="flex-row justify-end mt-4 pt-3 border-t border-gray-100 gap-2">
                <TouchableOpacity
                    onPress={() => onEdit(session)}
                    className="bg-gray-200 p-2 rounded-lg"
                >
                    <Ionicons name="pencil" size={20} color="black"/>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDelete} className="bg-red-500 p-2 rounded-lg">
                    <Ionicons name="trash" size={20} color="white"/>
                </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default SessionCard;