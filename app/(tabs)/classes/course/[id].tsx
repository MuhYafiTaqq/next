import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  ListRenderItem,
  TouchableOpacity,
  Alert,
  TextInput, // Pastikan ini diimpor
  Image
} from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/Auth';
import SessionCard from '@/components/sessioncard';
import { images } from '@/constants/images';
import Modal from 'react-native-modal';
import CreateSessionModal from './CreateSessionModal';

import EditSessionModal from '@/components/EditSessionModal';

// --- Interface untuk Session (HARUS SAMA PERSIS dengan yang di SessionCard.tsx dan EditSessionModal.tsx) ---
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

interface CourseDetails {
  id: number;
  title: string; // Pastikan ini ada di interface CourseDetails
  details: string | null;
  lecturer_name: string | null;
  location: string | null;
  time: string | null;
  class_id: number;
}

// --- Komponen Utama CourseDetailScreen ---
const CourseDetailScreen = () => {
  const { id: courseId } = useLocalSearchParams();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('member');
  const { session } = useAuth();

  // State untuk modal edit detail mata kuliah (course)
  const [isEditCourseModalVisible, setIsEditCourseModalVisible] = useState(false);
  // --- NEW STATE: for editedTitle ---
  const [editedTitle, setEditedTitle] = useState(''); // State untuk judul mata kuliah
  const [editedLecturerName, setEditedLecturerName] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedTime, setEditedTime] = useState('');

  // State untuk modal tambah sesi (CreateSessionModal)
  const [isCreateSessionModalVisible, setIsCreateSessionModalVisible] = useState(false);

  // State untuk modal edit SESI
  const [isEditSessionModalVisible, setIsEditSessionModalVisible] = useState(false);
  const [currentSessionToEdit, setCurrentSessionToEdit] = useState<Session | null>(null);


  const fetchCourseDetails = useCallback(async () => {
    if (!courseId || !session?.user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const { data: courseData, error: courseError } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (courseError) throw courseError;

      if (courseData) {
        setCourse(courseData);
        // --- NEW: Initialize editedTitle ---
        setEditedTitle(courseData.title || ''); // Inisialisasi editedTitle
        setEditedLecturerName(courseData.lecturer_name || '');
        setEditedLocation(courseData.location || '');
        setEditedTime(courseData.time || '');

        const { data: memberData, error: memberError } = await supabase.from('class_members')
          .select('role')
          .eq('class_id', courseData.class_id)
          .eq('user_id', session.user.id)
          .single();
        if (memberError) console.error("Error fetching member role:", memberError.message);
        if (memberData) setUserRole(memberData.role);
      }

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('session_date', { ascending: true })
        .order('id', { ascending: true });

      if (sessionsError) throw sessionsError;
      if (sessionsData) setSessions(sessionsData as Session[]);

    } catch (error: any) {
      console.error("Error fetching course details:", error.message || error);
      Alert.alert("Error", `Gagal memuat detail mata kuliah: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [courseId, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchCourseDetails();
    }, [fetchCourseDetails])
  );


  const handleSaveCourseEdit = async () => {
    if (!course) return;
    const { error } = await supabase
      .from('courses')
      // --- NEW: Include title in update ---
      .update({ title: editedTitle, lecturer_name: editedLecturerName, location: editedLocation, time: editedTime })
      .eq('id', course.id);

    if (error) {
      Alert.alert("Error", "Gagal memperbarui mata kuliah.");
    } else {
      Alert.alert("Sukses", "Mata kuliah berhasil diperbarui.");
      // --- NEW: Update title in local state ---
      setCourse(prev => prev ? { ...prev, title: editedTitle, lecturer_name: editedLecturerName, location: editedLocation, time: editedTime } : prev);
      setIsEditCourseModalVisible(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    Alert.alert(
      "Hapus Sesi",
      "Apakah Anda yakin ingin menghapus sesi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('course_sessions').delete().eq('id', sessionId);
            if (error) {
              Alert.alert("Error", `Gagal menghapus sesi: ${error.message}`);
            } else {
              setSessions(prev => prev.filter(s => s.id !== sessionId));
              Alert.alert("Sukses", "Sesi berhasil dihapus.");
            }
          },
        },
      ]
    );
  };


  const handleEditSession = (sessionToEdit: Session) => {
    setCurrentSessionToEdit(sessionToEdit);
    setIsEditSessionModalVisible(true);
  };

  const handleSaveEditedSession = async (updatedSession: Session) => {
    const { id, ...updates } = updatedSession;
    const { error } = await supabase
      .from('course_sessions')
      .update(updates)
      .eq('id', id);

    if (error) {
      Alert.alert("Error", `Gagal memperbarui sesi: ${error.message}`);
    } else {
      Alert.alert("Sukses", "Sesi berhasil diperbarui.");
      setIsEditSessionModalVisible(false);
      fetchCourseDetails();
    }
  };


  const renderSessionItem: ListRenderItem<Session> = ({ item, index }) => (
    <SessionCard
      session={item}
      index={index}
      userRole={userRole}
      onDelete={handleDeleteSession}
      onEdit={handleEditSession}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {loading ? (
        <ActivityIndicator className="mt-20" size="large" />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <>
              <View className='p-6'>
                <View className="bg-blue-50 rounded-lg p-6 mb-4 flex-row gap-4 relative">
                  <View className='justify-center items-center'>
                    <Image source={images.kelas1} resizeMode='contain' className='w-20 h-20' />
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold">{course?.title}</Text>
                    <Text className="text-sm text-primary/60 mt-2.5">Dosen       : {course?.lecturer_name || '-'}</Text>
                    <Text className="text-sm text-primary/60 mt-0.5">Lokasi      : {course?.location || '-'}</Text>
                    <Text className="text-sm text-primary/60 mt-0.5">Waktu       : {course?.time || '-'}</Text>
                  </View>
                  {userRole === 'admin' && (
                    <TouchableOpacity
                      onPress={() => setIsEditCourseModalVisible(true)}
                      className="absolute top-4 right-4 bg-white p-2 rounded-full shadow"
                    >
                      <Ionicons name="pencil" size={20} color="black" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View className="flex-row justify-between items-center p-6 pt-0">
                <Text className="text-2xl font-bold">Daftar Pertemuan :</Text>
                {userRole === 'admin' && (
                  <TouchableOpacity
                    className="bg-blue-500 p-2 rounded-full"
                    onPress={() => setIsCreateSessionModalVisible(true)}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          }
          renderItem={renderSessionItem}
          ListEmptyComponent={<View className="items-center mt-4"><Text>Belum ada sesi untuk mata kuliah ini.</Text></View>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Modal Edit Detail Mata Kuliah (Course) */}
      <Modal
        isVisible={isEditCourseModalVisible}
        onBackdropPress={() => setIsEditCourseModalVisible(false)}
        onBackButtonPress={() => setIsEditCourseModalVisible(false)}
      >
        <View className="bg-white p-6 rounded-lg">
          <Text className="text-lg font-bold mb-4">Edit Mata Kuliah</Text>

          {/* --- NEW INPUT: for Course Title --- */}
          <Text className="text-sm font-semibold">Nama Mata Kuliah</Text>
          <TextInput
            value={editedTitle} // Menggunakan state editedTitle
            onChangeText={setEditedTitle} // Mengupdate state editedTitle
            placeholder="Nama Mata Kuliah"
            className="border border-gray-300 rounded-lg p-3 my-2"
          />

          <Text className="text-sm font-semibold">Nama Dosen</Text>
          <TextInput
            value={editedLecturerName}
            onChangeText={setEditedLecturerName}
            placeholder="Nama Dosen"
            className="border border-gray-300 rounded-lg p-3 my-2"
          />

          <Text className="text-sm font-semibold">Lokasi</Text>
          <TextInput
            value={editedLocation}
            onChangeText={setEditedLocation}
            placeholder="Lokasi"
            className="border border-gray-300 rounded-lg p-3 my-2"
          />

          <Text className="text-sm font-semibold">Waktu</Text>
          <TextInput
            value={editedTime}
            onChangeText={setEditedTime}
            placeholder="Waktu"
            className="border border-gray-300 rounded-lg p-3 my-2"
          />

          <TouchableOpacity
            onPress={handleSaveCourseEdit}
            className="bg-blue-500 p-3 rounded-lg mt-4 items-center"
          >
            <Text className="text-white font-bold">Simpan Perubahan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsEditCourseModalVisible(false)}
            className="bg-gray-200 p-3 rounded-lg mt-2 items-center"
          >
            <Text className="text-black font-bold">Batal</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal Tambah Sesi */}
      <CreateSessionModal
        isVisible={isCreateSessionModalVisible}
        onClose={() => setIsCreateSessionModalVisible(false)}
        courseId={courseId as string}
        sessionCount={sessions.length}
        onSessionCreated={fetchCourseDetails}
      />

      {/* Modal Edit Sesi */}
      {isEditSessionModalVisible && currentSessionToEdit && (
        <EditSessionModal
          visible={isEditSessionModalVisible}
          onClose={() => setIsEditSessionModalVisible(false)}
          sessionData={currentSessionToEdit}
          onSave={handleSaveEditedSession}
        />
      )}
    </SafeAreaView>
  );
};

export default CourseDetailScreen;