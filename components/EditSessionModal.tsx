import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  // HAPUS 'Modal' dari baris import ini!
  Pressable,
  TextInput,
  ScrollView
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Modal from 'react-native-modal'; // <-- Ini adalah import Modal yang BENAR yang harus digunakan
import { Ionicons } from '@expo/vector-icons';

// --- Interface Session (Pastikan ini SAMA PERSIS dengan yang di CourseDetailScreen.tsx dan SessionCard.tsx) ---
interface Session {
  id: number;
  session_date: string | null;
  topic: string;
  assignment_details: string | null;
  assignment_deadline: string | null;
  material_link: string | null;
  photo_link: string | null;
  youtube_link: string | null;
}

interface EditSessionModalProps {
  visible: boolean;
  onClose: () => void;
  sessionData: Session | null;
  onSave: (updatedSession: Session) => void;
}

// Helper untuk parse string tanggal ke objek Date untuk picker
const parseDateToPickerFormat = (dateString: string | null | undefined): Date => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

// Helper untuk format objek Date dari picker kembali ke string
const formatPickerDateToString = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// Helper untuk format tampilan tanggal yang lebih user-friendly
const formatDisplayDate = (date: Date | null): string => {
  if (!date) return "Pilih Tanggal & Waktu";
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ' ' + date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};


const EditSessionModal: React.FC<EditSessionModalProps> = ({ visible, onClose, sessionData, onSave }) => {
  const [editedTopic, setEditedTopic] = useState(sessionData?.topic || '');
  const [editedAssignmentDetails, setEditedAssignmentDetails] = useState(sessionData?.assignment_details || '');
  const [selectedAssignmentDeadline, setSelectedAssignmentDeadline] = useState<Date | null>(parseDateToPickerFormat(sessionData?.assignment_deadline));
  const [editedMaterialLink, setEditedMaterialLink] = useState(sessionData?.material_link || '');
  const [editedPhotoLink, setEditedPhotoLink] = useState(sessionData?.photo_link || '');
  const [editedYoutubeLink, setEditedYoutubeLink] = useState(sessionData?.youtube_link || '');

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  useEffect(() => {
    if (sessionData) {
      setEditedTopic(sessionData.topic || '');
      setEditedAssignmentDetails(sessionData.assignment_details || '');
      setSelectedAssignmentDeadline(parseDateToPickerFormat(sessionData.assignment_deadline));
      setEditedMaterialLink(sessionData.material_link || '');
      setEditedPhotoLink(sessionData.photo_link || '');
      setEditedYoutubeLink(sessionData.youtube_link || '');
    }
  }, [sessionData]);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDeadline = (date: Date) => {
    setSelectedAssignmentDeadline(date);
    hideDatePicker();
  };

  const handleSave = () => {
    const updatedData: Session = {
      ...sessionData!,
      topic: editedTopic,
      assignment_details: editedAssignmentDetails,
      assignment_deadline: selectedAssignmentDeadline ? formatPickerDateToString(selectedAssignmentDeadline) : null,
      material_link: editedMaterialLink,
      photo_link: editedPhotoLink,
      youtube_link: editedYoutubeLink,
    };
    onSave(updatedData);
  };

  return (
    <Modal
      isVisible={visible} // <-- Sekarang prop isVisible seharusnya dikenali dengan benar
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
    >
      <View className="flex-1 justify-center items-center">
        <View className="bg-white p-6 rounded-lg w-full max-h-[80%]">
          <Text className="text-lg font-bold mb-4">Edit Sesi</Text>

          <ScrollView className="w-full flex-grow">
            <Text className="text-sm font-semibold mt-2">Topik Sesi</Text>
            <TextInput
              value={editedTopic}
              onChangeText={setEditedTopic}
              placeholder="Topik Sesi"
              className="border border-gray-300 rounded-lg p-3 my-2"
            />

            <Text className="text-sm font-semibold mt-2">Detail Tugas</Text>
            <TextInput
              value={editedAssignmentDetails}
              onChangeText={setEditedAssignmentDetails}
              placeholder="Detail Tugas"
              multiline
              className="border border-gray-300 rounded-lg p-3 my-2 h-20"
            />

            <Text className="text-sm font-semibold mt-2">Deadline Tugas:</Text>
            <TouchableOpacity onPress={showDatePicker} className="border border-gray-300 rounded-lg p-3 my-2 flex-row justify-between items-center">
              <Text className="text-base text-gray-700">
                {formatDisplayDate(selectedAssignmentDeadline)}
              </Text>
              <Ionicons name="calendar-outline" size={24} color="gray" />
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="datetime"
              onConfirm={handleConfirmDeadline}
              onCancel={hideDatePicker}
              date={selectedAssignmentDeadline || new Date()}
            />

            <Text className="text-sm font-semibold mt-2">Link Materi</Text>
            <TextInput
              value={editedMaterialLink}
              onChangeText={setEditedMaterialLink}
              placeholder="Link Materi (URL)"
              className="border border-gray-300 rounded-lg p-3 my-2"
            />

            <Text className="text-sm font-semibold mt-2">Link Foto</Text>
            <TextInput
              value={editedPhotoLink}
              onChangeText={setEditedPhotoLink}
              placeholder="Link Foto (URL)"
              className="border border-gray-300 rounded-lg p-3 my-2"
            />

            <Text className="text-sm font-semibold mt-2">Link YouTube</Text>
            <TextInput
              value={editedYoutubeLink}
              onChangeText={setEditedYoutubeLink}
              placeholder="Link YouTube (URL)"
              className="border border-gray-300 rounded-lg p-3 my-2"
            />
          </ScrollView>

          <TouchableOpacity
            onPress={handleSave}
            className="bg-blue-500 p-3 rounded-lg mt-4 items-center w-full"
          >
            <Text className="text-white font-bold">Simpan Perubahan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-200 p-3 rounded-lg mt-2 items-center w-full"
          >
            <Text className="text-black font-bold">Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default EditSessionModal;