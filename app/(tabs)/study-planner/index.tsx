import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ListRenderItem,
  Image,
  StatusBar
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';
import { icons } from '@/constants/icons';
import { images } from '@/constants/images';
import { geminiAPI } from '@/services/geminiAPI';

// Tipe untuk setiap item dalam to-do list
interface TodoItem {
  id: string;
  task: string;
  is_completed: boolean;
  details?: string | null;
}

// Tipe untuk study plan
interface StudyPlan {
  id: number;
  topic: string;
  created_at: string;
  user_id: string;
}

const StudyPlannerScreen = () => {
  const [topic, setTopic] = useState('');
  const [plan, setPlan] = useState<TodoItem[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
  // State baru untuk multiple planner
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  
  const { session } = useAuth();
  const username = session?.user?.user_metadata?.username || 'Guest';
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);

  const progress = plan.length > 0
    ? Math.round((plan.filter(item => item.is_completed).length / plan.length) * 100)
    : 0;

  // Fungsi untuk memuat semua study plans
  const loadAllPlans = useCallback(async () => {
    if (!session?.user) { setLoading(false); return; }
    setLoading(true);

    const { data: plansData } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
    
    if (plansData && plansData.length > 0) {
      setStudyPlans(plansData);
    } else {
      setStudyPlans([]);
      setPlan([]);
      setTopic('');
      setCurrentPlanId(null);
    }
    setLoading(false);
  }, [session]);

  // Fungsi untuk memuat plan spesifik
  const loadSpecificPlan = async (planId: string | number) => {
    const numericPlanId = typeof planId === 'string' ? parseInt(planId) : planId;
    const plan = studyPlans.find(p => p.id === numericPlanId) || 
                 (await supabase.from('study_plans').select('*').eq('id', numericPlanId).single()).data;
    
    if (plan) {
      setTopic(plan.topic);
      setCurrentPlanId(plan.id.toString());
      const { data: itemsData } = await supabase
        .from('study_plan_items')
        .select('*')
        .eq('plan_id', plan.id)
        .order('item_order', { ascending: true });
      
      if (itemsData) {
        setPlan(itemsData.map(item => ({ 
          ...item, 
          id: item.id.toString(), 
          is_completed: item.completed 
        })));
      }
    }
  };

  useFocusEffect(
       useCallback(() => {
           loadAllPlans();
       },[loadAllPlans])
   );



  // Fungsi untuk membuat rencana baru (untuk backward compatibility)
  const handleGeneratePlan = async () => {
    if (topic.trim().length === 0 || !session?.user) return Alert.alert("Input Kosong", "Silakan masukkan topik.");
    setLoading(true);
    setPlan([]);

    try {
      // Menggunakan service Gemini API yang baru
      const parsedTasks = await geminiAPI.generateStudyPlan(topic);

      const { data: newPlan, error: planError } = await supabase.from('study_plans').insert({ user_id: session.user.id, topic: topic }).select().single();
      if (planError) throw planError;
      setCurrentPlanId(newPlan.id.toString());

      const itemsToInsert = parsedTasks.map((task, index) => ({ plan_id: newPlan.id, task: task.replace(/\*\*/g, ''), item_order: index }));
      const { data: newItems, error: itemsError } = await supabase.from('study_plan_items').insert(itemsToInsert).select();
      if (itemsError) throw itemsError;
      setPlan(newItems.map(item => ({...item, id: item.id.toString(), is_completed: item.completed })));
      
      // Update study plans list
      setStudyPlans(prev => [newPlan, ...prev]);
      
    } catch (error) {
      console.error("Error generating plan:", error);
      Alert.alert("Error", "Gagal membuat rencana belajar. Coba lagi.");
      loadAllPlans(); // Kembali ke state awal jika gagal
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mendapatkan detail dari AI
const handleFetchDetails = async (item: TodoItem) => {
  if (expandedItemId === item.id) { setExpandedItemId(null); return; }
  if (item.details) { setExpandedItemId(item.id); return; }

  setLoadingDetailsId(item.id);

  try {
    // Menggunakan service Gemini API yang baru
    const detailsText = await geminiAPI.generateTaskDetails(item.task, topic);
    
    if (detailsText) {
      await supabase.from('study_plan_items').update({ details: detailsText }).eq('id', item.id);
      const updatedPlan = plan.map(p => p.id === item.id ? { ...p, details: detailsText } : p);
      setPlan(updatedPlan);
      setExpandedItemId(item.id);
    }
  } catch (error) {
    console.error("Error fetching details:", error);
  } finally {
    setLoadingDetailsId(null);
  }
};
  
  // Fungsi untuk menandai tugas selesai
  const toggleTodo = async (item: TodoItem) => {
    const newCompletedStatus = !item.is_completed;
    // Update UI secara optimis untuk respon instan
    setPlan(prev => prev.map(p => p.id === item.id ? { ...p, is_completed: newCompletedStatus } : p));
    
    // Kirim pembaruan ke database dengan nama kolom yang benar
    await supabase
      .from('study_plan_items')
      .update({ completed: newCompletedStatus }) // Gunakan 'is_completed'
      .eq('id', item.id);
  };
  
  // Fungsi untuk memilih plan dari list
  const handleSelectPlan = async (planId: string) => {
    await loadSpecificPlan(planId);
  };

  // Fungsi untuk menghapus rencana
  const handleDeletePlan = async (planId?: string) => {
    const targetPlanId = planId || currentPlanId;
    if (!targetPlanId || !session?.user) return;
    
    Alert.alert(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus rencana belajar ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('study_plans')
                .delete()
                .eq('id', targetPlanId)
                .eq('user_id', session.user.id);
              
              if (error) throw error;
              
              // Update study plans list
              setStudyPlans(prev => prev.filter(plan => plan.id.toString() !== targetPlanId));
              
              // If deleting current plan, reset or load another plan
              if (targetPlanId === currentPlanId) {
                const remainingPlans = studyPlans.filter(plan => plan.id.toString() !== targetPlanId);
                if (remainingPlans.length > 0) {
                  await loadSpecificPlan(remainingPlans[0].id);
                } else {
                  setPlan([]);
                  setTopic('');
                  setCurrentPlanId(null);
                }
              }
              
              Alert.alert("Berhasil", "Rencana belajar telah dihapus.");
            } catch (error) {
              console.error("Error deleting plan:", error);
              Alert.alert("Error", "Gagal menghapus rencana belajar.");
            }
          }
        }
      ]
    );
  };

  const renderRoadmapItem: ListRenderItem<TodoItem> = ({ item }) => (
    <View className="bg-green-100 p-4 min-h-20 mx-6 my-2 rounded-xl shadow-sm border border-gray-100 flex justify-center">
        <TouchableOpacity onPress={() => handleFetchDetails(item)} className="flex-row items-center">
            {/* ✅ PERBAIKAN: Gunakan 'is_completed' */}
            <Checkbox style={{ marginRight: 15 }} value={item.is_completed} onValueChange={() => toggleTodo(item)} color={item.is_completed ? '#10B981' : undefined}/>
            <Text className={`text-lg font-bold flex-1 text-primary`}>{item.task}</Text>
            <Ionicons name={expandedItemId === item.id ? "chevron-up" : "chevron-down"} size={20} color="gray" className='pl-5' />
        </TouchableOpacity>
        {loadingDetailsId === item.id ? (
            <ActivityIndicator style={{ marginTop: 10 }} />
        ) : (
            expandedItemId === item.id && item.details && (
                <View className="mt-3 pt-3 border-t border-black/20 ml-10">
                    <Text className="text-sm text-gray-600 leading-relaxed text-justify">{item.details}</Text>
                </View>
            )
        )}
    </View>
  );

  if (loading) return <View className="flex-1 justify-center"><ActivityIndicator size="large"/></View>;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {currentPlanId ? (
        // Tampilan Roadmap jika sudah ada rencana
        <View className="flex-1">
          <View className="px-6 py-4 bg-white">
            <View className='bg-blue-50 p-4 rounded-xl'>
              <View className="flex-row justify-between items-start">
                  <TouchableOpacity 
                    onPress={() => {
                      setPlan([]);
                      setTopic('');
                      setCurrentPlanId(null);
                    }} 
                    className="p-2 -ml-2"
                  >
                    <Ionicons name="arrow-back" size={24} color="#10B981"/>
                  </TouchableOpacity>
                  <View className="flex-1 mx-3">
                      <Text className="text-xs text-gray-500">Rencana Belajar Anda</Text>
                      <Text className="text-2xl font-bold" numberOfLines={1}>{topic}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => {
                      setPlan([]);
                      setTopic('');
                      setCurrentPlanId(null);
                    }} className="p-2">
                        <Ionicons name="add-outline" size={24} color="#10B981"/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePlan()} className="p-2">
                        <Ionicons name="trash-outline" size={24} color="red"/>
                    </TouchableOpacity>
                  </View>
              </View>
              <Text className="text-base font-semibold text-gray-700 mt-4">Progress</Text>
              <View className="w-full h-3 bg-white rounded-full overflow-hidden mt-2">
                  <View className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
              </View>
              <Text className="text-right text-sm text-gray-500 mt-1">{progress}% Selesai</Text>
            </View>
          </View>
          <FlatList data={plan} keyExtractor={(item) => item.id} renderItem={renderRoadmapItem} contentContainerStyle={{ paddingVertical: 8, paddingBottom: 80 }}/>
        </View>
      ) : (
        // Tampilan Input dan Daftar Study Plans
        <View className="flex-1">
          {/* Form Input */}
          <View className="items-center justify-center p-6">
            <Image source={images.aiplanner} className='h-60' resizeMode='contain' />
            <Text className="text-3xl font-bold text-primary my-4 text-center">Bingung belajar mulai dari mana?</Text>
            <Text className="text-base text-center text-gray-500 mb-6">Masukkan topik atau tujuan belajar Anda, dan biarkan AI menyusun roadmap langkah demi langkah untuk Anda.</Text>
            <TextInput
              placeholder="Contoh: Belajar Web Development"
              value={topic}
              onChangeText={setTopic}
              className="w-full bg-gray-100 p-4 rounded-lg text-base mb-6 border border-gray-300"
            />
            <TouchableOpacity 
              onPress={handleGeneratePlan} 
              className="bg-primary w-full py-4 rounded-lg items-center shadow"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">Buat Rencana Belajar</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Study Plans List - Only show if there are saved plans */}
          {studyPlans.length > 0 && (
            <View className="px-6 pb-6">
              <Text className="text-xl font-bold text-primary mb-4">Study Plans Tersimpan</Text>
              <FlatList
                data={studyPlans}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectPlan(item.id.toString())}
                    className="p-4 mb-3 rounded-xl border bg-gray-50 border-gray-200"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-800" numberOfLines={2}>
                          {item.topic}
                        </Text>
                        <Text className="text-sm text-gray-500 mt-1">
                          Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeletePlan(item.id.toString())}
                        className="p-2 -mr-2"
                      >
                        <Ionicons name="trash-outline" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      )}


    </SafeAreaView>
  );
};

export default StudyPlannerScreen;
