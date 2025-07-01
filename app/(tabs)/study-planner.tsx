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
  Image
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';
import { icons } from '@/constants/icons';

// Tipe untuk setiap item dalam to-do list
interface TodoItem {
  id: string;
  task: string;
  is_completed: boolean;
  details?: string | null;
}

const StudyPlannerScreen = () => {
  const [topic, setTopic] = useState('');
  const [plan, setPlan] = useState<TodoItem[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const { session } = useAuth();
    const username = session?.user?.user_metadata?.username || 'Guest';
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);

  const progress = plan.length > 0
    ? Math.round((plan.filter(item => item.is_completed).length / plan.length) * 100)
    : 0;

  // Fungsi untuk memuat rencana yang sudah ada
  const loadExistingPlan = useCallback(async () => {
    if (!session?.user) { setLoading(false); return; }
    setLoading(true);

    const { data: planData } = await supabase
        .from('study_plans')
        .select('id, topic')
        .eq('user_id', session.user.id)
        .single();
    
    if (planData) {
      setTopic(planData.topic);
      setCurrentPlanId(planData.id);
      const { data: itemsData } = await supabase.from('study_plan_items').select('*').eq('plan_id', planData.id).order('item_order', { ascending: true });
      if (itemsData) setPlan(itemsData.map(item => ({ ...item, id: item.id.toString(), is_completed: item.completed })));
    } else {
      setPlan([]);
      setTopic('');
      setCurrentPlanId(null);
    }
    setLoading(false);
  }, [session]);

  useFocusEffect(
      useCallback(() => {
          loadExistingPlan();
      },[loadExistingPlan])
  );

  // Fungsi untuk membuat rencana baru
  const handleGeneratePlan = async () => {
    if (topic.trim().length === 0 || !session?.user) return Alert.alert("Input Kosong", "Silakan masukkan topik.");
    setLoading(true);
    setPlan([]);
    if (currentPlanId) await supabase.from('study_plans').delete().eq('id', currentPlanId);

    const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    const prompt = `Anda adalah ahli kurikulum. Buatkan roadmap belajar untuk topik: "${topic}". Balas HANYA dengan array JSON dari string. Jangan gunakan format markdown seperti **. Contoh: ["Langkah 1", "Langkah 2"]`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) throw new Error("Respons dari AI tidak valid.");

      const cleanedText = responseText.replace(/```json\n|```/g, '').trim();
      const parsedTasks: string[] = JSON.parse(cleanedText);

      const { data: newPlan, error: planError } = await supabase.from('study_plans').insert({ user_id: session.user.id, topic: topic }).select().single();
      if (planError) throw planError;
      setCurrentPlanId(newPlan.id);

      const itemsToInsert = parsedTasks.map((task, index) => ({ plan_id: newPlan.id, task: task.replace(/\*\*/g, ''), item_order: index }));
      const { data: newItems, error: itemsError } = await supabase.from('study_plan_items').insert(itemsToInsert).select();
      if (itemsError) throw itemsError;
      setPlan(newItems.map(item => ({...item, id: item.id.toString(), is_completed: item.completed })));
    } catch (error) {
      console.error("Error generating plan:", error);
      Alert.alert("Error", "Gagal membuat rencana belajar. Coba lagi.");
      loadExistingPlan(); // Kembali ke state awal jika gagal
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mendapatkan detail dari AI
  const handleFetchDetails = async (item: TodoItem) => {
    if (expandedItemId === item.id) { setExpandedItemId(null); return; }
    if (item.details) { setExpandedItemId(item.id); return; }
    
    setLoadingDetailsId(item.id);
    const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    const prompt = `Berikan penjelasan detail (2-3 kalimat) untuk langkah belajar: "${item.task}", dalam konteks topik "${topic}". Jangan gunakan format markdown seperti **.`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      const detailsText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/\*\*/g, '');
      
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
  
  // Fungsi untuk menghapus rencana belajar
  const handleDeletePlan = () => {
    Alert.alert("Hapus Rencana", "Apakah Anda yakin ingin menghapus rencana belajar ini dan memulai dari awal?", [
      { text: "Batal", style: 'cancel' },
      { text: "Hapus", style: 'destructive', onPress: async () => {
        if(currentPlanId) await supabase.from('study_plans').delete().eq('id', currentPlanId);
        loadExistingPlan(); // Muat ulang, akan menampilkan halaman input
      }},
    ]);
  };

  const renderRoadmapItem: ListRenderItem<TodoItem> = ({ item }) => (
    <View className="bg-white p-4 mx-4 my-1.5 rounded-xl shadow-sm border border-gray-100">
        <TouchableOpacity onPress={() => handleFetchDetails(item)} className="flex-row items-center">
            {/* ✅ PERBAIKAN: Gunakan 'is_completed' */}
            <Checkbox style={{ marginRight: 15 }} value={item.is_completed} onValueChange={() => toggleTodo(item)} color={item.is_completed ? '#10B981' : undefined}/>
            <Text className={`text-base flex-1 ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.task}</Text>
            <Ionicons name={expandedItemId === item.id ? "chevron-up" : "chevron-down"} size={20} color="gray" />
        </TouchableOpacity>
        {loadingDetailsId === item.id ? (
            <ActivityIndicator style={{ marginTop: 10 }} />
        ) : (
            expandedItemId === item.id && item.details && (
                <View className="mt-3 pt-3 border-t border-gray-100 ml-10">
                    <Text className="text-sm text-gray-600 leading-relaxed">{item.details}</Text>
                </View>
            )
        )}
    </View>
  );

  if (loading) return <View className="flex-1 justify-center"><ActivityIndicator size="large"/></View>;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      {currentPlanId ? (
        // Tampilan Roadmap jika sudah ada rencana
        <View className="flex-1">
          <View className="px-6 pb-4 border-b border-gray-200 bg-white">
            <View className='bg-blue-50 p-4 rounded-xl'>
              <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                      <Text className="text-xs text-gray-500">Rencana Belajar Anda</Text>
                      <Text className="text-2xl font-bold" numberOfLines={1}>{topic}</Text>
                  </View>
                  <TouchableOpacity onPress={handleDeletePlan} className="p-2 -mr-2">
                      <Ionicons name="trash-outline" size={24} color="red"/>
                  </TouchableOpacity>
              </View>
              <Text className="text-base font-semibold text-gray-700 mt-4">Progress</Text>
              <View className="w-full h-3 bg-gray-300 rounded-full overflow-hidden mt-2">
                  <View className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
              </View>
              <Text className="text-right text-sm text-gray-500 mt-1">{progress}% Selesai</Text>
            </View>
          </View>
          <FlatList data={plan} keyExtractor={(item) => item.id} renderItem={renderRoadmapItem} contentContainerStyle={{ paddingVertical: 8 }}/>
        </View>
      ) : (
        // Tampilan Input jika belum ada rencana
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="bulb-outline" size={60} color="#a1a1aa"/>
          <Text className="text-2xl font-bold text-gray-800 my-4 text-center">AI Study Planner</Text>
          <Text className="text-base text-center text-gray-500 mb-6">Masukkan topik atau tujuan belajar Anda, dan biarkan AI menyusun roadmap langkah demi langkah untuk Anda.</Text>
          <TextInput
            placeholder="Contoh: Belajar Web Development"
            value={topic}
            onChangeText={setTopic}
            className="w-full bg-gray-100 p-4 rounded-lg text-base mb-4 border border-gray-300"
          />
          <TouchableOpacity 
            onPress={handleGeneratePlan} 
            className="bg-blue-500 w-full py-4 rounded-full items-center shadow"
            disabled={loading}
          >
            <Text className="text-white font-semibold text-lg">Buat Rencana Belajar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default StudyPlannerScreen;
