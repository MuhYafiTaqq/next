import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  ListRenderItem,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Linking
} from 'react-native';
import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, Stack, useFocusEffect, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/Auth';
import SessionCard from '@/components/sessioncard';

// Definisikan tipe data
interface Session {
  id: number;
  session_date: string;
  topic: string;
  assignment_details: string | null;
  assignment_deadline: string | null;
  material_link: string | null;
  photo_link: string | null;
  youtube_link: string | null;
}

interface CourseDetails {
  id: number;
  title: string;
  details: string | null;
  lecturer_name: string | null;
  location: string | null;
  time: string | null;
  class_id: number;
}

const CourseDetailScreen = () => {
  const { id: courseId } = useLocalSearchParams();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('member');
  const { session } = useAuth();
  
  useFocusEffect(
    useCallback(() => {
      const fetchCourseDetails = async () => {
        if (!courseId || !session?.user) return;
        setLoading(true);

        try {
          // Ambil detail mata kuliah
          const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();
          if (courseData) {
            setCourse(courseData);
            // Cek peran pengguna di kelas ini
            const { data: memberData } = await supabase.from('class_members').select('role').eq('class_id', courseData.class_id).eq('user_id', session.user.id).single();
            if (memberData) setUserRole(memberData.role);
          }
          
          // Ambil daftar sesi
          const { data: sessionsData } = await supabase.from('course_sessions').select('*').eq('course_id', courseId).order('session_date', { ascending: true });
          if (sessionsData) setSessions(sessionsData);
        
        } catch (error) {
            console.error("Error fetching course details:", error);
        } finally {
            setLoading(false);
        }
      };
      
      fetchCourseDetails();
    }, [courseId, session])
  );

  const handleDeleteSession = async (sessionId: number) => {
    const { error } = await supabase.from('course_sessions').delete().eq('id', sessionId);
    if (error) {
        Alert.alert("Error", "Gagal menghapus sesi.");
    } else {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        Alert.alert("Sukses", "Sesi berhasil dihapus.");
    }
  };

  const renderSessionItem: ListRenderItem<Session> = ({ item, index }) => (
    <SessionCard session={item} index={index} userRole={userRole} onDelete={handleDeleteSession} />
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Stack.Screen options={{ title: course?.title || 'Detail Mata Kuliah' }} />
       {loading ? <ActivityIndicator className="mt-20" size="large" /> : (
        <FlatList
            data={sessions}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={
                <>
                    {/* Header yang menampilkan detail mata kuliah */}
                    <View className="p-4 bg-white mb-4">
                        <Text className="text-2xl font-bold">{course?.title}</Text>
                        <Text className="text-base text-gray-600 mt-2">Dosen: {course?.lecturer_name || '-'}</Text>
                        <Text className="text-base text-gray-600">Lokasi: {course?.location || '-'}</Text>
                        <Text className="text-base text-gray-600">Waktu: {course?.time || '-'}</Text>
                    </View>
                    
                    {/* Header untuk daftar sesi */}
                    <View className="flex-row justify-between items-center p-4 pt-0">
                      <Text className="text-2xl font-bold">Daftar Sesi</Text>
                      {userRole === 'admin' && (
                          <Link href={{ pathname: "/create-session", params: { course_id: courseId, session_count: sessions.length } }} asChild>
                              <TouchableOpacity className="bg-blue-500 p-2 rounded-full">
                                  <Ionicons name="add" size={24} color="white" />
                              </TouchableOpacity>
                          </Link>
                        )}
                    </View>
                </>
            }
            renderItem={renderSessionItem}
            ListEmptyComponent={<View className="items-center mt-4"><Text>Belum ada sesi untuk mata kuliah ini.</Text></View>}
            contentContainerStyle={{ paddingBottom: 20 }}
        />
       )}
    </SafeAreaView>
  );
};

export default CourseDetailScreen;
