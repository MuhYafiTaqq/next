import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ListRenderItem,
  Image,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/Auth";
import { useFocusEffect, useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { icons } from "@/constants/icons";

interface Course {
  id: number;
  title: string;
  semester: string;
}

interface ClassData {
  id: number;
  name: string;
  description: string | null;
  join_code: string;
  role: string;
}

const semesterOptions = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

const STORAGE_KEY = "lastSelectedSemester";

const ClassesScreen = () => {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const { session } = useAuth();
  const router = useRouter();

  const saveSemester = async (newSemester: string) => {
    setSelectedSemester(newSemester);
    await AsyncStorage.setItem("last_selected_semester", newSemester);
    await fetchUserClass(newSemester); // ✅ fetch ulang data berdasarkan semester yang dipilih
  };

  const loadLastSemester = async () => {
    const last = await AsyncStorage.getItem(STORAGE_KEY);
    if (last && semesterOptions.includes(last)) {
      setSelectedSemester(last);
    }
  };

  const fetchUserClass = async (semester: string) => {
    if (!session?.user) return;
    setLoading(true);

    const { data: memberData } = await supabase
      .from("class_members")
      .select("class_id, role")
      .eq("user_id", session.user.id)
      .single();

    if (!memberData) {
      setClassData(null);
      setCourses([]);
      setLoading(false);
      return;
    }

    const { data: classInfo } = await supabase
      .from("classes")
      .select("id, name, description, join_code")
      .eq("id", memberData.class_id)
      .single();

    if (classInfo) {
      setClassData({ ...classInfo, role: memberData.role });
      fetchCourses(classInfo.id, semester);
    } else {
      setClassData(null);
      setCourses([]);
    }

    setLoading(false);
  };

  const fetchCourses = async (classId: number, semester: string) => {
    setCourseLoading(true);
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("class_id", classId)
      .eq("semester", semester);

    setCourses(data || []);
    setCourseLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      const loadSemesterAndFetch = async () => {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const semester =
          saved && semesterOptions.includes(saved) ? saved : "Semester 1";

        setSelectedSemester(semester);
        await fetchUserClass(semester);
      };
      loadSemesterAndFetch();
    }, [session])
  );

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert("Tersalin!", "Kode kelas disalin.");
  };

  const handleLeaveClass = async () => {
    Alert.alert("Keluar dari Kelas", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          if (classData?.role === "admin") {
            // ✅ Admin keluar → hapus semua data
            const classId = classData.id;
            await supabase.from("courses").delete().eq("class_id", classId);
            await supabase
              .from("class_members")
              .delete()
              .eq("class_id", classId);
            await supabase.from("classes").delete().eq("id", classId);
          } else {
            await supabase
              .from("class_members")
              .delete()
              .eq("user_id", session?.user.id)
              .eq("class_id", classData?.id);
          }

          setClassData(null);
          setCourses([]);
        },
      },
    ]);
  };

  const renderClassItem: ListRenderItem<Course> = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: `/course/[id]`, params: { id: item.id } })
      }
      className="bg-white p-5 m-3 rounded-xl shadow-sm"
    >
      <Text className="text-lg font-bold text-gray-800">{item.title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View>
        {classData ? (
          <>
            {/* Class Info */}
            <View className="p-4 bg-white shadow-sm border-b border-gray-200">
              <Text className="text-2xl font-bold">{classData.name}</Text>
              <Text className="text-gray-600 mt-1">
                {classData.description}
              </Text>
              <Text className="text-blue-600 mt-2 font-semibold">
                Peran Anda: {classData.role === "admin" ? "Admin" : "Anggota"}
              </Text>

              {classData.role === "admin" && (
                <View className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex-row justify-between items-center">
                  <View>
                    <Text className="text-xs text-gray-500">Kode Gabung</Text>
                    <Text className="text-lg font-mono font-bold tracking-widest">
                      {classData.join_code}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCopyCode(classData.join_code)}
                    className="p-2 bg-blue-100 rounded-full"
                  >
                    <Ionicons name="copy-outline" size={24} color="black" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Tombol keluar */}
              <TouchableOpacity
                onPress={handleLeaveClass}
                className="mt-4 bg-red-500 py-2 px-4 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Keluar dari Kelas
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dropdown Semester */}
            <View className="px-6 my-2">
              <Text className="text-sm text-gray-500 mb-1">Pilih Semester</Text>
              <View className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                <Picker
                  selectedValue={selectedSemester}
                  onValueChange={(val) => saveSemester(val)}
                  mode="dropdown"
                >
                  {semesterOptions.map((s) => (
                    <Picker.Item key={s} label={s} value={s} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Course List */}
            {courseLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={courses}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                  <Text className="text-xl font-bold px-4 mt-4 mb-2">
                    Mata Kuliah
                  </Text>
                }
                renderItem={renderClassItem}
                ListEmptyComponent={
                  <View className="items-center mt-10">
                    <Text>Belum ada mata kuliah.</Text>
                  </View>
                }
              />
            )}

            {classData.role === "admin" && (
              <Link
                href={{
                  pathname: "/create-course",
                  params: {
                    class_id: classData.id,
                    semester: selectedSemester,
                  },
                }}
                asChild
              >
                <TouchableOpacity className="absolute bottom-24 right-6 bg-blue-500 w-16 h-16 rounded-full justify-center items-center shadow-lg">
                  <Ionicons name="add" size={32} color="white" />
                </TouchableOpacity>
              </Link>
            )}
          </>
        ) : (
          <View className="flex-1 justify-center items-center px-6">
            <Ionicons name="school-outline" size={80} color="gray" />
            <Text className="text-2xl font-bold mt-4 text-center">
              Belum Gabung Kelas
            </Text>
            <Text className="text-base text-gray-600 text-center my-4">
              Buat atau gabung ke kelas terlebih dahulu.
            </Text>
            <Link href="/create-class" asChild>
              <TouchableOpacity className="bg-blue-500 p-4 rounded-lg items-center w-full mb-2">
                <Text className="text-white font-bold text-lg">
                  Buat Kelas Baru
                </Text>
              </TouchableOpacity>
            </Link>
            <Link href="/join-class" asChild>
              <TouchableOpacity className="bg-gray-200 p-4 rounded-lg items-center w-full">
                <Text className="text-black font-bold text-lg">
                  Gabung Kelas
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ClassesScreen;
