import React, {
    ActivityIndicator,
    Alert,
    Pressable,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    SafeAreaView,
    ListRenderItem,
    Image,
} from "react-native";
import { icons } from "@/constants/icons";
import { router, Link, useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '@/context/Auth';
import { supabase } from "@/lib/supabase";
import Checkbox from 'expo-checkbox';

// Import services AI API
import { aiAPI } from '@/services/geminiAPI'; // Pastikan path ini benar!
import { images } from '@/constants/images'; // Pastikan ini diimpor jika menggunakan images.aiplanner

// --- Interfaces yang Sudah Ada (Pastikan Ini Sama dengan Project Anda) ---
// Interface untuk tabel 'courses' (mata kuliah)
interface Course {
    id: number;
    class_id: number | null;
    title: string | null; // Ini akan menjadi 'name' dari kelas Anda
    details: string | null;
    lecturer_name: string | null;
    location: string | null;
    time: string | null;
    semester: string | null;
}

// Interface untuk data sesi kursus (course_sessions)
interface CourseSession {
    id: number;
    course_id: Course | null; // course_id akan berisi objek Course setelah join
    session_date: string | null;
    topic: string | null;
    assignment_details: string | null;
    material_link: string | null;
    photo_link: string | null;
    youtube_link: string | null;
    assignment_deadline: string | null;
}

// Interface untuk setiap item to-do
interface Todo {
    id: number;
    user_id: string;
    session_id: CourseSession | null; // session_id akan berisi objek CourseSession setelah join
    task_description: string;
    deadline: string | null;
    is_completed: boolean;
    created_at: string;
}

interface ClassData {
    id: number;
    name: string;
    description: string | null;
    join_code: string | null; // Null karena tidak ada di tabel courses, sesuaikan jika ada di classes
    role: string;
}

interface ClassMembersSupabaseData {
    id: number;
    role: string;
    classes: {
        id: number;
        name: string;
        description: string | null;
    } | null;
}

// --- NEW INTERFACES UNTUK AI STUDY PLANNER ---
interface AIStudyTodoItem {
    id: string; // ID dari Supabase biasanya number, tapi jika di-toString() maka string
    task: string;
    is_completed: boolean; // Menyesuaikan dengan kolom 'completed' di DB
    details?: string | null;
    plan_id: number;
    item_order: number;
}

interface AIStudyPlan {
    id: number;
    topic: string;
    created_at: string;
    user_id: string;
}

export default function HomeScreen() {
    const { session, loading: authLoading } = useAuth();

    const [classData, setClassData] = useState<ClassData[]>([]);
    const [menuVisible, setMenuVisible] = useState(false);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loadingTodos, setLoadingTodos] = useState(true);

    // --- STATE BARU UNTUK AI STUDY PLANNER ---
    const [latestStudyPlan, setLatestStudyPlan] = useState<AIStudyPlan | null>(null);
    const [latestPlanItems, setLatestPlanItems] = useState<AIStudyTodoItem[]>([]);
    const [loadingStudyPlan, setLoadingStudyPlan] = useState(true);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null); // Untuk detail todo di home screen
    const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);

    const username = session?.user?.user_metadata?.username || 'Pengguna';
    const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);

    const handleLogout = async () => {
        setMenuVisible(false);
        supabase.auth.signOut();
    };

    // --- LOGIC UNTUK TODO LIST REGULER (DARI KELAS) ---
    const fetchTodos = useCallback(async () => {
        if (!session?.user) {
            setLoadingTodos(false);
            return;
        }
        setLoadingTodos(true);
        const { data, error } = await supabase
            .from('todos')
            .select('*, session_id!inner(id, session_date, topic, assignment_details, course_id!inner(title, lecturer_name))')
            .eq('user_id', session.user.id)
            .eq('is_completed', false)
            .order('deadline', { ascending: true, nullsFirst: false });

        if (error) {
            console.error("Error fetching todos:", error);
            Alert.alert('Error', 'Gagal memuat daftar tugas.');
        } else {
            setTodos(data || []);
        }
        setLoadingTodos(false);
    }, [session, setTodos]);

    const toggleTodo = async (id: number, currentStatus: boolean) => {
        // Optimistic update
        setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));

        const { error } = await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);

        if (error) {
            console.error("Error updating todo:", error);
            Alert.alert('Error', 'Gagal memperbarui tugas.');
            // Rollback optimistic update
            setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: currentStatus } : t));
        } else {
            fetchTodos();
        }
    };

    // --- RENDER FUNCTION UNTUK REGULAR TODO ITEM (DIPINDAHKAN KE ATAS) ---
    const renderTodoItem: ListRenderItem<Todo> = ({ item }) => (
        <View className="flex-row items-center bg-gray-50 p-4 mx-6 my-1.5 rounded-lg border border-gray-200">
            <Checkbox
                value={item.is_completed}
                onValueChange={() => toggleTodo(item.id, item.is_completed)}
                color={item.is_completed ? '#10B981' : undefined}
                style={{ marginRight: 15 }}
            />
            <View className="flex-1">
                {item.session_id && (
                    <View className="">
                        {item.session_id.course_id && item.session_id.course_id.title && (
                            <Text className="text-xl font-semibold text-primary">{item.session_id.course_id.title}</Text>
                        )}
                    </View>
                )}
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
    // --- END LOGIC UNTUK TODO LIST REGULER ---

    // --- LOGIC UNTUK CLASS DATA (SUDAH ADA) ---
    const fetchClassData = useCallback(async () => {
        if (!session?.user) {
            console.log("No session user found for fetching class data.");
            return;
        }

        console.log("Fetching class data for user:", session.user.id);

        const { data, error } = await supabase
            .from('class_members')
            .select('role, classes(id, name, description)')
            .eq('user_id', session.user.id)
            .limit(1) as { data: ClassMembersSupabaseData[] | null; error: any };

        if (error) {
            console.error("Error fetching class data:", error);
            console.error("Supabase Error Details:", error.details);
            console.error("Supabase Error Hint:", error.hint);
            Alert.alert('Error', 'Gagal memuat data kelas.');
        } else {
            console.log("Raw data from Supabase for class:", data);
            if (data && data.length > 0 && data[0].classes) {
                const classDetails = data[0].classes;
                setClassData([{
                    id: classDetails.id,
                    name: classDetails.name!,
                    description: classDetails.description,
                    join_code: null,
                    role: data[0].role
                }]);
                console.log("Class Data Set (processed):", classData);
            } else {
                setClassData([]);
                console.log("No Class Data found for this user or incomplete data. Data was:", data);
            }
        }
    }, [session]);
    // --- END LOGIC UNTUK CLASS DATA ---

    // --- LOGIC BARU UNTUK AI STUDY PLANNER (RINGKASAN DI HOME) ---
    const loadLatestStudyPlan = useCallback(async () => {
        if (!session?.user) {
            setLoadingStudyPlan(false);
            setLatestStudyPlan(null);
            setLatestPlanItems([]);
            return;
        }
        setLoadingStudyPlan(true);
        try {
            const { data: plansData, error: plansError } = await supabase
                .from('study_plans')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (plansError) {
                console.error("Error loading latest study plan:", plansError);
                setLatestStudyPlan(null);
                setLatestPlanItems([]);
                return;
            }

            if (plansData && plansData.length > 0) {
                const latestPlan = plansData[0];
                setLatestStudyPlan(latestPlan);

                const { data: itemsData, error: itemsError } = await supabase
                    .from('study_plan_items')
                    .select('*')
                    .eq('plan_id', latestPlan.id)
                    .order('item_order', { ascending: true });

                if (itemsError) {
                    console.error("Error loading latest plan items:", itemsError);
                    setLatestPlanItems([]);
                    return;
                }
                setLatestPlanItems(itemsData ? itemsData.map(item => ({
                    ...item,
                    id: item.id.toString(),
                    is_completed: item.completed
                })) : []);

            } else {
                setLatestStudyPlan(null);
                setLatestPlanItems([]);
            }
        } catch (err) {
            console.error("Unexpected error in loadLatestStudyPlan:", err);
        } finally {
            setLoadingStudyPlan(false);
        }
    }, [session]);

    const toggleAIStudyTodo = async (item: AIStudyTodoItem) => {
        const newCompletedStatus = !item.is_completed;
        // Optimistic update
        setLatestPlanItems(prev => prev.map(p => p.id === item.id ? { ...p, is_completed: newCompletedStatus } : p));

        const { error } = await supabase
            .from('study_plan_items')
            .update({ completed: newCompletedStatus })
            .eq('id', parseInt(item.id));

        if (error) {
            console.error("Error updating AI todo:", error);
            Alert.alert('Error', 'Gagal memperbarui tugas AI.');
            // Rollback optimistic update
            setLatestPlanItems(prev => prev.map(p => p.id === item.id ? { ...p, is_completed: !newCompletedStatus } : p));
        }
    };

    const handleFetchDetailsAI = async (item: AIStudyTodoItem) => {
        if (!latestStudyPlan) return;
        if (expandedItemId === item.id) { setExpandedItemId(null); return; }
        if (item.details) { setExpandedItemId(item.id); return; }

        setLoadingDetailsId(item.id);

        try {
            const detailsText = await aiAPI.generateTaskDetails(item.task, latestStudyPlan.topic);

            if (detailsText) {
                const updatedItems = latestPlanItems.map(p => p.id === item.id ? { ...p, details: detailsText } : p);
                setLatestPlanItems(updatedItems);

                await supabase.from('study_plan_items').update({ details: detailsText }).eq('id', parseInt(item.id));
                setExpandedItemId(item.id);
            }
        } catch (error) {
            console.error("Error fetching details on Home:", error);
            Alert.alert("Error", "Gagal mengambil detail tugas AI.");
        } finally {
            setLoadingDetailsId(null);
        }
    };

    const aiProgress = useMemo(() => {
        return latestPlanItems.length > 0
            ? Math.round((latestPlanItems.filter(item => item.is_completed).length / latestPlanItems.length) * 100)
            : 0;
    }, [latestPlanItems]);

    const nextAIStudyTodo = useMemo(() => {
        const unfinishedTodos = latestPlanItems.filter(item => !item.is_completed);
        if (unfinishedTodos.length === 0) return null;
        return unfinishedTodos.sort((a, b) => a.item_order - b.item_order)[0];
    }, [latestPlanItems]);
    // --- END LOGIC BARU UNTUK AI STUDY PLANNER ---

    // --- USE EFFECT UNTUK SEMUA FETCH DATA ---
    useFocusEffect(
        useCallback(() => {
            fetchTodos();
            fetchClassData();
            loadLatestStudyPlan();
        }, [fetchTodos, fetchClassData, loadLatestStudyPlan])
    );

    if (authLoading) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#10B981" /></View>;
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <FlatList
                data={todos}
                keyExtractor={(item) => `todo-${item.id.toString()}`}
                renderItem={renderTodoItem} // renderTodoItem sekarang sudah didefinisikan di atas
                ListHeaderComponent={
                    <View>
                        {/* Quote Card */}
                        <View className="px-6 mb-6">
                            <View className="flex-row justify-between bg-orange-50 p-5 rounded-xl">
                                <View className="w-4/5 justify-center">
                                    <Text className="text-orange-600 text-lg font-medium leading-tight">Belajar bukan hanya soal mengejar nilai, tapi juga menjaga diri agar tetap bernilai.</Text>
                                </View>
                                <View className="w-1/5 flex justify-center items-center">
                                    <Image source={icons.roket} className="w-16 h-16" resizeMode="contain" />
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

                        {/* Study Planner Card - NEW SECTION */}
                        <View className="px-6 mb-6">
                            <Text className="text-xl font-bold mb-4">AI Study Planner</Text>
                            {loadingStudyPlan ? (
                                <View className="bg-gray-100 p-4 rounded-xl items-center justify-center h-40">
                                    <ActivityIndicator size="large" color="#10B981" />
                                    <Text className="mt-2 text-gray-600">Memuat rencana belajar...</Text>
                                </View>
                            ) : (latestStudyPlan ? (
                                <TouchableOpacity
                                    onPress={() => router.push('/study-planner')} // Navigasi ke halaman Study Planner penuh
                                    className="bg-blue-100 p-4 rounded-xl shadow-sm border border-blue-200"
                                >
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="text-base font-semibold text-blue-700">Rencana Terakhir:</Text>
                                        <Link href="/study-planner" className="text-blue-500 font-semibold">
                                            Lihat Selengkapnya
                                        </Link>
                                    </View>
                                    <Text className="text-2xl font-bold text-gray-800" numberOfLines={1}>{latestStudyPlan.topic}</Text>
                                    <View className="w-full h-2 bg-blue-200 rounded-full overflow-hidden mt-2">
                                        <View className="h-full bg-blue-500 rounded-full" style={{ width: `${aiProgress}%` }} />
                                    </View>
                                    <Text className="text-right text-sm text-gray-600 mt-1">{aiProgress}% Selesai</Text>

                                    {nextAIStudyTodo && (
                                        <View className="mt-4 pt-3 border-t border-blue-200">
                                            <Text className="text-base font-semibold text-gray-700 mb-2">Tugas Selanjutnya:</Text>
                                            <View className="flex-row items-center">
                                                <Checkbox
                                                    value={nextAIStudyTodo.is_completed}
                                                    onValueChange={() => toggleAIStudyTodo(nextAIStudyTodo)}
                                                    color={nextAIStudyTodo.is_completed ? '#10B981' : undefined}
                                                    style={{ marginRight: 15 }}
                                                />
                                                <Text className={`text-lg font-medium flex-1 ${nextAIStudyTodo.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                                    {nextAIStudyTodo.task}
                                                </Text>
                                            </View>
                                            {loadingDetailsId === nextAIStudyTodo.id ? (
                                                <ActivityIndicator style={{ marginTop: 10, marginLeft: 30 }} />
                                            ) : (
                                                expandedItemId === nextAIStudyTodo.id && nextAIStudyTodo.details && (
                                                    <View className="mt-2 pt-2 border-t border-gray-200 ml-10">
                                                        <Text className="text-sm text-gray-600 leading-relaxed text-justify">
                                                            {nextAIStudyTodo.details}
                                                        </Text>
                                                    </View>
                                                )
                                            )}
                                            <TouchableOpacity onPress={() => handleFetchDetailsAI(nextAIStudyTodo)} className="mt-2 ml-auto">
                                                <Text className="text-sm text-blue-500 font-semibold">
                                                    {expandedItemId === nextAIStudyTodo.id ? "Sembunyikan Detail" : "Lihat Detail"}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    {!nextAIStudyTodo && latestPlanItems.length > 0 && (
                                        <Text className="mt-4 text-center text-gray-600">Semua tugas dalam rencana ini sudah selesai! 🎉</Text>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View className="bg-gray-100 p-4 rounded-xl items-center justify-center h-40">
                                    {/* Menggunakan ikon Ionicons 'book' sebagai fallback yang pasti ada */}
                                    <Ionicons name="book-outline" size={80} color="#9CA3AF" style={{ marginBottom: 8 }} />
                                    <Text className="text-center text-gray-600">Belum ada rencana belajar AI.</Text>
                                    <Link href="/study-planner" className="mt-2 text-blue-500 font-semibold">
                                        Buat Rencana Baru
                                    </Link>
                                </View>
                            ))}
                        </View>

                        {/* Judul To-Do List dan Nama Kelas (Regular Todos) */}
                        <View className="mx-6 mb-2 p-4 bg-red-50 rounded-lg">
                            {classData.length > 0 ? (
                                <>
                                    <Text className="text-base text-red-700 font-semibold">Tugas dari Kelas:</Text>
                                    <Text className="text-xl text-red-900 font-bold">{classData[0]?.name}</Text>
                                </>
                            ) : (
                                <Text className="text-base text-gray-500">Memuat data kelas...</Text>
                            )}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View className="items-center mt-10">
                        <Text className="text-gray-500">{loadingTodos ? 'Memuat tugas kelas...' : 'Tidak ada tugas dari kelas. Selamat!'}</Text>
                    </View>
                }
                onRefresh={fetchTodos}
                refreshing={loadingTodos}
                contentContainerStyle={{ paddingBottom: 50 }}
            />
        </SafeAreaView>
    );
}