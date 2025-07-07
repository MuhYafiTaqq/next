import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { supabase } from '@/lib/supabase';

interface CreateSessionModalProps {
  isVisible: boolean;
  onClose: () => void;
  courseId: string;
  sessionCount: number;
  onSessionCreated: () => void;
}

const CreateSessionModal = ({
  isVisible,
  onClose,
  courseId,
  sessionCount,
  onSessionCreated,
}: CreateSessionModalProps) => {
  const [topic, setTopic] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date());
  const [assignmentDeadline, setAssignmentDeadline] = useState(new Date());
  const [hasAssignment, setHasAssignment] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState<'session' | 'deadline' | null>(null);

  useEffect(() => {
    if (isVisible) {
      setTopic(`Pertemuan ke-${sessionCount + 1}: `);
    }
  }, [isVisible, sessionCount]);

  useEffect(() => {
    if (!isVisible) {
      setTopic('');
      setSessionDate(new Date());
      setAssignmentDeadline(new Date());
      setHasAssignment(false);
      setAssignmentDetails('');
      setLoading(false);
      setPickerVisible(null);
    }
  }, [isVisible]);

  const handleSave = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Topik tidak boleh kosong.');
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('course_sessions').insert({
      course_id: courseId,
      session_date: sessionDate.toISOString(),
      topic: topic,
      assignment_details: hasAssignment ? assignmentDetails : null,
      assignment_deadline: hasAssignment ? assignmentDeadline.toISOString() : null,
    });

    setLoading(false);
    if (error) {
      Alert.alert('Error', `Gagal membuat sesi: ${error.message}`);
    } else {
      Alert.alert('Sukses', 'Sesi berhasil ditambahkan.');
      onSessionCreated();
      onClose();
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.6}
      avoidKeyboard
    >
      <View className="max-h-[80%]">
        <ScrollView
          className="bg-white p-6 rounded-2xl"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-2xl font-bold text-center mb-4">Tambah Sesi Baru</Text>

          <Text className="text-sm font-semibold">Topik</Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder="Topik sesi"
            className="border border-gray-300 rounded-lg p-3 my-2"
          />

          <Text className="text-sm font-semibold mt-2">Tanggal & Waktu Pertemuan</Text>
          <TouchableOpacity
            onPress={() => setPickerVisible('session')}
            className="bg-gray-100 p-3 rounded-lg mt-2"
          >
            <Text className="text-gray-800">
              {sessionDate.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-between mt-4">
            <Text className="text-sm font-semibold">Ada Tugas?</Text>
            <Switch value={hasAssignment} onValueChange={setHasAssignment} />
          </View>

          {hasAssignment && (
            <View className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Text className="text-sm font-semibold">Detail Tugas</Text>
              <TextInput
                value={assignmentDetails}
                onChangeText={setAssignmentDetails}
                placeholder="Deskripsi tugas"
                multiline
                className="bg-white border border-gray-300 rounded-lg p-3 mt-2 h-24"
                style={{ textAlignVertical: 'top' }}
              />

              <Text className="text-sm font-semibold mt-4">Deadline Tugas</Text>
              <TouchableOpacity
                onPress={() => setPickerVisible('deadline')}
                className="bg-gray-100 p-3 rounded-lg mt-2"
              >
                <Text className="text-gray-800">
                  {assignmentDeadline.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <DateTimePickerModal
            isVisible={pickerVisible !== null}
            mode="datetime"
            onConfirm={(date) => {
              if (pickerVisible === 'session') setSessionDate(date);
              if (pickerVisible === 'deadline') setAssignmentDeadline(date);
              setPickerVisible(null);
            }}
            onCancel={() => setPickerVisible(null)}
            locale="id-ID"
          />

          <TouchableOpacity
            onPress={handleSave}
            className="bg-blue-600 p-3 rounded-lg mt-5 items-center"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Simpan Pertemuan</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-200 p-3 rounded-lg mt-3 items-center"
          >
            <Text className="text-black font-semibold">Batal</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default CreateSessionModal;
