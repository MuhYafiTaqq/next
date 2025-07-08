import { 
    ActivityIndicator, 
    Alert, 
    Pressable, 
    StatusBar, 
    Text, 
    TouchableOpacity, 
    View, 
    FlatList,
    SafeAreaView,
    ListRenderItem
} from "react-native";
import { Image } from "react-native";
import { icons } from "@/constants/icons";
import { router, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '@/context/Auth';
import { supabase } from "@/lib/supabase";
import Checkbox from 'expo-checkbox';
import { useFocusEffect } from 'expo-router';

// Tipe untuk setiap item to-do
interface Todo {
  id: number;
  task_description: string;
  deadline: string | null;
  is_completed: boolean;
}

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(true);

  const username = session?.user?.user_metadata?.username || 'Guest';
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);

  const handleLogout = async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
  };

  const fetchTodos = useCallback(async () => {
    if (!session?.user) { 
        setLoadingTodos(false); 
        return; 
    }
    setLoadingTodos(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('deadline', { ascending: true, nullsFirst: false });

    if (error) Alert.alert('Error', 'Gagal memuat daftar tugas.');
    else setTodos(data || []);
    setLoadingTodos(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
        fetchTodos();
    }, [fetchTodos])
  );

  const toggleTodo = async (id: number, currentStatus: boolean) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);
  };

  const renderTodoItem: ListRenderItem<Todo> = ({ item }) => (
    <View className="flex-row items-center bg-gray-50 p-4 mx-4 my-1.5 rounded-lg border border-gray-200">
        <Checkbox
            value={item.is_completed}
            onValueChange={() => toggleTodo(item.id, item.is_completed)}
            color={item.is_completed ? '#10B981' : undefined}
            style={{ marginRight: 15 }}
        />
        <View className="flex-1">
            <Text className={`text-base ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {item.task_description}
            </Text>
            {item.deadline && (
                <Text className="text-sm text-red-500 mt-1">
                    Deadline: {new Date(item.deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </Text>
            )}
        </View>
    </View>
  );

  if (authLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="light-content" backgroundColor="#ffffff" />
        <FlatList
            data={todos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTodoItem}
            ListHeaderComponent={
                <Pressable onPress={() => setMenuVisible(false)}>
                    {/* Quote Card */}
                    <View className="px-6 mb-6">
                        <View className="flex-row justify-between bg-orange-50 p-5 rounded-xl">
                            <View className="w-4/5 justify-center">
                                <Text className="text-orange-600 text-lg font-medium leading-tight">Belajar bukan hanya soal mengejar nilai, tapi juga menjaga diri agar tetap bernilai.</Text>
                            </View>
                            <View className="w-1/5 flex justify-center items-center">
                                <Image source={icons.roket} className="w-16 h-16" resizeMode="contain"/>
                            </View>
                        </View>
                    </View>
                    
                    {/* Navigation Cards */}
                    <View className="px-6 mb-6">
                        <Text className="text-xl font-bold mb-4">Quick Access</Text>
                        <View className="flex-row justify-between">
                            <TouchableOpacity 
                                className="flex-1 bg-blue-50 p-4 rounded-xl mr-2 items-center"
                                onPress={() => router.push('/chat')}
                            >
                                <Ionicons name="chatbubbles" size={32} color="#3B82F6" />
                                <Text className="text-blue-600 font-semibold mt-2">Chat</Text>
                                <Text className="text-blue-500 text-xs text-center">Friends & Psychologist</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                className="flex-1 bg-green-50 p-4 rounded-xl ml-2 items-center"
                                onPress={() => router.push('/gemini-assistant')}
                            >
                                <Ionicons name="sparkles" size={32} color="#10B981" />
                                <Text className="text-green-600 font-semibold mt-2">Sahabat Online</Text>
                                <Text className="text-green-500 text-xs text-center">Teman Dengar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {/* Judul To-Do List */}
                    <View className="px-6 mb-2">
                        <Text className="text-2xl font-bold">Daftar Tugas Kuliah</Text>
                    </View>
                </Pressable>
            }
            ListEmptyComponent={
                <View className="items-center mt-10">
                    <Text className="text-gray-500">{loadingTodos ? 'Memuat tugas...' : 'Tidak ada tugas. Selamat!'}</Text>
                </View>
            }
            onRefresh={fetchTodos}
            refreshing={loadingTodos}
            contentContainerStyle={{ paddingBottom: 50 }}
        />
    </SafeAreaView>
  );
}
