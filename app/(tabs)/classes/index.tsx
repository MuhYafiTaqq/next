import { useAuth } from "@/context/Auth";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  ListRenderItem,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
// import { icons } from "@/constants/icons"; // Jika tidak digunakan, bisa dihapus

import { images } from "@/constants/images"; // Pastikan ini ada dan berisi images.kontak, images.whatsapp, images.profile
import Modal from 'react-native-modal';

import CreateClassModal from "./CreateClassModal";
import JoinClassModal from "./JoinClassModal";

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

interface Dosen {
  id: string; // UUID dari Supabase
  name: string;
  nip: string;
  phone_number_display: string | null; // Bisa null
  whats_app_number: string | null;     // Bisa null
  profile_image_url: string | null;    // Bisa null
  class_id: number; // Foreign Key ke tabel kelas
}

const semesterOptions = [
  "Semester 1", "Semester 2", "Semester 3", "Semester 4",
  "Semester 5", "Semester 6", "Semester 7", "Semester 8",
];

const { width: screenWidth } = Dimensions.get('window');

// Konfigurasi untuk perhitungan lebar item
const numColumns = 6; // Jumlah kolom yang diinginkan
const containerHorizontalPadding = 16 * 2; // px-4 di View utama = 16px kiri + 16px kanan
const gapHorizontal = 6; // gap-x-3 = 12px antar item
const totalGapsWidth = (numColumns - 1) * gapHorizontal;
const availableWidthForItems = screenWidth - containerHorizontalPadding - totalGapsWidth;
const itemWidth = availableWidthForItems / numColumns;

const STORAGE_KEY = "lastSelectedSemester";

const { height: screenHeight } = Dimensions.get('window');


const ClassesScreen = () => {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const { session } = useAuth();
  const router = useRouter();

    const [title, setTitle] = useState('');

  const [modalDosen, setModalDosen] = useState(false); // State untuk modal daftar dosen
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [dosenListLoading, setDosenListLoading] = useState(false);

  const [modalBuatKelas, setModalBuatKelas] = useState(false);
  const [modalGabungKelas, setModalGabungKelas] = useState(false);

  // State untuk modal Tambah/Edit dosen
  const [showAddEditDosenModal, setShowAddEditDosenModal] = useState(false);
  const [editingDosenId, setEditingDosenId] = useState<string | null>(null); // null = tambah, string = edit
  const [newDosenName, setNewDosenName] = useState('');
  const [newDosenNip, setNewDosenNip] = useState('');
  const [newDosenPhoneDisplay, setNewDosenPhoneDisplay] = useState('');
  const [newDosenWhatsAppNumber, setNewDosenWhatsAppNumber] = useState('');
  const [newDosenProfileImageUrl, setNewDosenProfileImageUrl] = useState('');
  const [saveDosenLoading, setSaveDosenLoading] = useState(false); // Mengganti addDosenLoading

  const [modalBuatMakul, setModalBuatMakul] = useState(false);
  const handleCreateCourse = async () => {
    if (!title.trim()) {
        Alert.alert('Error', 'Judul mata kuliah tidak boleh kosong.');
        return;
    }
    if (!classData?.id) {
        Alert.alert('Error', 'ID kelas tidak tersedia.');
        return;
    }

    setLoading(true);

    const { error } = await supabase.from('courses').insert({
        title,
        semester: selectedSemester,
        class_id: classData.id,
    });

    setLoading(false);

    if (error) {
        Alert.alert('Error', 'Gagal menambahkan mata kuliah: ' + error.message);
    } else {
        Alert.alert('Sukses', 'Mata kuliah berhasil ditambahkan.');
        setModalBuatMakul(false);
        setTitle(""); // Reset form
        fetchCourses(classData.id, selectedSemester); // Refresh daftar makul
    }
};



  // --- useEffect untuk mengisi form saat mengedit ---
  useEffect(() => {
    if (editingDosenId && dosenList.length > 0) {
      const dosenToEdit = dosenList.find(d => d.id === editingDosenId);
      if (dosenToEdit) {
        setNewDosenName(dosenToEdit.name);
        setNewDosenNip(dosenToEdit.nip);
        setNewDosenPhoneDisplay(dosenToEdit.phone_number_display || '');
        setNewDosenWhatsAppNumber(dosenToEdit.whats_app_number || '');
        setNewDosenProfileImageUrl(dosenToEdit.profile_image_url || '');
      }
    } else {
      // Reset form saat tidak dalam mode edit (misal: modal baru dibuka untuk tambah)
      setNewDosenName('');
      setNewDosenNip('');
      setNewDosenPhoneDisplay('');
      setNewDosenWhatsAppNumber('');
      setNewDosenProfileImageUrl('');
    }
  }, [editingDosenId, dosenList]); // Re-run saat editingDosenId atau dosenList berubah

  // --- Fungsi: Fetch Daftar Dosen dari Supabase (DENGAN CLASS_ID) ---
  const fetchDosenList = useCallback(async (classId: number) => {
    if (!classId) {
      setDosenList([]);
      setDosenListLoading(false);
      return;
    }
    setDosenListLoading(true);
    const { data, error } = await supabase
      .from('dosen')
      .select('*')
      .eq('class_id', classId)
      .order('name', { ascending: true }); // Urutkan berdasarkan nama

    if (error) {
      console.error('Error fetching dosen list:', error);
      Alert.alert('Error', 'Gagal memuat daftar dosen: ' + error.message);
      setDosenList([]);
    } else {
      setDosenList(data || []);
    }
    setDosenListLoading(false);
  }, []);

  // --- Fungsi: Tambah/Edit Dosen ke Supabase ---
  const handleSaveDosen = async () => { // Mengganti handleAddDosen
    if (!newDosenName || !newDosenNip) {
      Alert.alert('Peringatan', 'Nama dan NIP dosen tidak boleh kosong.');
      return;
    }
    if (!classData || !classData.id) {
        Alert.alert('Error', 'ID Kelas tidak ditemukan. Tidak dapat menyimpan dosen.');
        return;
    }

    setSaveDosenLoading(true);
    let error = null;

    const dosenDataToSave = {
      name: newDosenName,
      nip: newDosenNip,
      phone_number_display: newDosenPhoneDisplay || null,
      whats_app_number: newDosenWhatsAppNumber || null,
      profile_image_url: newDosenProfileImageUrl || null,
      class_id: classData.id,
    };

    if (editingDosenId) {
      // MODE EDIT
      const { error: updateError } = await supabase
        .from('dosen')
        .update(dosenDataToSave)
        .eq('id', editingDosenId);
      error = updateError;
    } else {
      // MODE TAMBAH
      const { error: insertError } = await supabase
        .from('dosen')
        .insert(dosenDataToSave);
      error = insertError;
    }

    if (error) {
      console.error('Error saving dosen:', error);
      Alert.alert('Error', 'Gagal menyimpan dosen: ' + error.message);
    } else {
      Alert.alert('Berhasil', editingDosenId ? 'Dosen berhasil diupdate!' : 'Dosen berhasil ditambahkan!');
      setShowAddEditDosenModal(false); // Tutup modal
      setEditingDosenId(null); // Reset mode edit
      // Reset form secara otomatis oleh useEffect jika editingDosenId menjadi null
      fetchDosenList(classData.id); // Muat ulang daftar dosen
    }
    setSaveDosenLoading(false);
  };

  // --- Fungsi: Hapus Dosen ---
  const handleDeleteDosen = async (dosenId: string) => {
    Alert.alert(
      "Hapus Dosen",
      "Yakin ingin menghapus dosen ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            if (!classData || !classData.id) return;
            const { error } = await supabase
              .from('dosen')
              .delete()
              .eq('id', dosenId);

            if (error) {
              console.error('Error deleting dosen:', error);
              Alert.alert('Error', 'Gagal menghapus dosen: ' + error.message);
            } else {
              Alert.alert('Berhasil', 'Dosen berhasil dihapus!');
              fetchDosenList(classData.id); // Muat ulang daftar
            }
          },
        },
      ]
    );
  };

  // --- Fungsi: Handler Klik Edit ---
  const handleEditClick = (dosen: Dosen) => {
    setEditingDosenId(dosen.id); // Set ID dosen yang diedit
    setShowAddEditDosenModal(true); // Buka modal
  };

  const saveSemester = async (newSemester: string) => {
    setSelectedSemester(newSemester);
    await AsyncStorage.setItem(STORAGE_KEY, newSemester);
    if (classData && classData.id) {
        await fetchCourses(classData.id, newSemester);
    }
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

    const { data: classInfo, error: classError } = await supabase
      .from("classes")
      .select("id, name, description, join_code")
      .eq("id", memberData.class_id)
      .single();

    if (classError) {
        console.error('Error fetching class info:', classError);
        Alert.alert('Error', 'Gagal memuat info kelas.');
        setClassData(null);
        setCourses([]);
        setLoading(false);
        return;
    }

    if (classInfo) {
      const updatedClassData = { ...classInfo, role: memberData.role };
      setClassData(updatedClassData);
      fetchCourses(classInfo.id, semester);
      fetchDosenList(classInfo.id); // Panggil fetchDosenList DENGAN classInfo.id
    } else {
      setClassData(null);
      setCourses([]);
    }

    setLoading(false);
  };

  const fetchCourses = async (classId: number, semester: string) => {
    setCourseLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("class_id", classId)
      .eq("semester", semester);

    if (error) {
        console.error('Error fetching courses:', error);
        Alert.alert('Error', 'Gagal memuat mata kuliah.');
    }
    setCourses(data || []);
    setCourseLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      const loadInitialData = async () => {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const semester =
          saved && semesterOptions.includes(saved) ? saved : "Semester 1";
        setSelectedSemester(semester);
        await fetchUserClass(semester);
      };
      loadInitialData();
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
          if (!classData || !session?.user) {
            Alert.alert('Error', 'Tidak dapat keluar dari kelas: Data tidak lengkap.');
            return;
          }
          if (classData.role === "admin") {
            const classId = classData.id;
            await supabase.from("dosen").delete().eq("class_id", classId); // Hapus dosen terkait
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
              .eq("user_id", session.user.id)
              .eq("class_id", classData.id);
          }

          setClassData(null);
          setCourses([]);
          // fetchDosenList(0); // Tidak perlu panggil ini jika classData sudah null
        },
      },
    ]);
  };

  const renderClassItem: ListRenderItem<Course> = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: `/classes/course/[id]`, params: { id: item.id } })
      }
      className="bg-red-100 py-4 px-3 my-1 rounded-xl shadow-sm flex-1 min-h-[80px] justify-center"
    >
      <View className="flex-row gap-3 items-center px-4 py-2">
        <Ionicons name="journal-outline" size={24} color="#dc2626" />
        <View className="flex-1">
          <Text className="text-base font-bold text-primary" numberOfLines={2}>{item.title}</Text>
          <Text className="text-xs text-primary/60 mt-1">{item.semester}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleWhatsAppPress = async (number: string) => {
    const message = 'Halo, saya ingin bertanya tentang mata kuliah...';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${number}&text=${encodedMessage}`;
    const whatsappWebUrl = `https://wa.me/${number}?text=${encodedMessage}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(whatsappWebUrl);
      }
    } catch (error) {
      console.error('Gagal membuka WhatsApp:', error);
      Alert.alert('Terjadi Kesalahan', 'Tidak dapat membuka WhatsApp. Pastikan nomor benar atau aplikasi terinstal.');
    }
  };

  const renderDosenItem: ListRenderItem<Dosen> = ({ item }) => (
    <View className="w-full bg-blue-300/40 rounded-lg my-2 p-3">
      <View className="flex flex-row gap-5 items-center">
        {item.profile_image_url ? (
          <Image source={{ uri: item.profile_image_url }} className="h-16 w-16 rounded-full" />
        ) : (
          <Ionicons name="person-circle" size={64} color="gray" />
        )}

        <View className="flex-1 gap-2">
          <View>
            <Text className="text-lg font-bold">{item.name}</Text>
            <Text className="text-sm text-gray-700">NIP: {item.nip}</Text>
            {item.whats_app_number && (
              <Text className="text-sm text-gray-700 font-semibold mt-1"> {item.whats_app_number}</Text>
            )}
          </View>
          <View className="flex">
            <TouchableOpacity
              className="flex flex-row justify-center items-center p-2 gap-2 bg-green-500 rounded-xl shadow-md"
              onPress={() => handleWhatsAppPress(item.whats_app_number || '')}
            >
              <Image source={images.whatsapp} className="h-5 w-5" />
              <Text className="text-white font-bold">Chat WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tombol Edit dan Hapus (Hanya untuk Admin) */}
        {classData?.role === "admin" && (
          <View className="flex-col gap-2">
            <TouchableOpacity
              onPress={() => handleEditClick(item)} // Memanggil handler edit
              className="p-2 bg-blue-500 rounded-full"
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteDosen(item.id)} // Memanggil handler hapus
              className="p-2 bg-red-500 rounded-full"
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" />
          </View>
        ) : classData ? (
          <View className="flex-1">
            {/* Class Info */}
            <View className="px-6">
              <View className="flex-row gap-4 w-full mt-4 items-center">
                <View className="w-24 h-24 justify-center items-center">
                  <Image source={images.kelas1} className="h-20 w-20" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold">{classData.name}</Text>
                  <Text className="text-primary/60 text-sm mt-1">
                    {classData.description}
                  </Text>
                  <Text className="text-blue-600 mt-2 font-semibold text-sm">
                    Peran Anda: {classData.role === "admin" ? "Admin" : "Anggota"}
                  </Text>
                </View>
              </View>

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

              {/* More Detail Section */}
              <View className="mt-6">
                <Text className="text-md font-bold mb-3">
                  More Detail :
                </Text>
                <View className="flex-row flex-wrap justify-between gap-3">
                  <TouchableOpacity
                    className="items-center"
                    onPress={() => {
                      if (classData && classData.id) {
                        fetchDosenList(classData.id);
                      }
                      setModalDosen(true);
                    }}
                  >
                    <View className="rounded-lg justify-center items-center p-3 bg-green-500" style={{ width: itemWidth, height: itemWidth }}>
                      <Ionicons name="people" size={24} color="white" />
                    </View>
                    <Text className="text-black text-xs mt-2">Data Dosen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="items-center">
                    <View className="rounded-lg justify-center items-center p-3 bg-blue-500" style={{ width: itemWidth, height: itemWidth }}>
                      <Ionicons name="document-text" size={24} color="white" />
                    </View>
                    <Text className="text-black text-xs mt-2">Dokumentasi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="items-center">
                    <View className="rounded-lg justify-center items-center p-3 bg-yellow-300" style={{ width: itemWidth, height: itemWidth }}>
                      <Ionicons name="wallet" size={24} color="white" />
                    </View>
                    <Text className="text-black text-xs mt-2">Keuangan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="items-center">
                    <View className="rounded-lg justify-center items-center p-3 bg-purple-500" style={{ width: itemWidth, height: itemWidth }}>
                      <Ionicons name="school" size={24} color="white" />
                    </View>
                    <Text className="text-black text-xs mt-2">Data Mahasiswa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Dropdown Semester */}
            <View className="px-6 my-4">
              <Text className="text-md font-bold mb-3">
                Mata Kuliah:
              </Text>

              <View className="flex-row items-center gap-3">
                {/* Picker */}
                <View className="flex-1 bg-white rounded-lg border border-gray-300 overflow-hidden">
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

                {/* Tombol ➕ muncul hanya untuk admin */}
                {classData.role === "admin" && (
                  <TouchableOpacity
                    className="bg-blue-500 w-12 h-12 rounded-full justify-center items-center shadow"
                    onPress={() => setModalBuatMakul(true)}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Course List */}
            <View className="flex-1 px-6">
              {courseLoading ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
              ) : (
                <FlatList
                  data={courses}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderClassItem}
                  numColumns={2}
                  columnWrapperStyle={{ gap: 12 }}
                  contentContainerStyle={{ paddingBottom: 50 }}
                  ListEmptyComponent={
                    <View className="items-center mt-10">
                      <Text>Belum ada mata kuliah.</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center px-6">
            <Image source={images.kelas} className="h-48" resizeMode="contain" />
            <Text className="text-3xl font-bold mt-5 text-center">
              Belum Gabung Kelas
            </Text>
            <Text className="text-base text-gray-600 text-center mb-10">
              Buat atau gabung ke kelas terlebih dahulu.
            </Text>
            <TouchableOpacity className="bg-primary py-4 px-8 rounded-lg items-center max-w-xs w-full mb-3" onPress={() => setModalBuatKelas(true)}>
              <Text className="text-white font-bold text-lg">
                Buat Kelas Baru
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-100 border border-primary/20 py-4 px-8 rounded-lg items-center max-w-xs w-full" onPress={() => setModalGabungKelas(true)}>
              <Text className="text-black font-bold text-lg">
                Gabung Kelas
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modals */}
        <CreateClassModal
          isVisible={modalBuatKelas}
          onClose={() => setModalBuatKelas(false)}
          onClassCreated={() => {
            setModalBuatKelas(false);
            fetchUserClass(selectedSemester);
          }}
        />
        <JoinClassModal
          isVisible={modalGabungKelas}
          onClose={() => setModalGabungKelas(false)}
          onClassJoined={() => {
            setModalGabungKelas(false);
            fetchUserClass(selectedSemester);
          }}
        />
        
        <Modal isVisible={modalBuatMakul}>
          <View className="bg-white p-6 rounded-lg">
            <Text className="text-lg font-semibold mb-2">Nama Mata Kuliah</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Contoh: Aljabar Linear"
              className="bg-white p-4 rounded-lg text-base border border-gray-300"
            />

            <Text className="text-lg font-semibold mt-4 mb-2">Semester</Text>
            <View className="bg-white border border-gray-300 rounded-lg p-4">
              <Text>{selectedSemester}</Text>
            </View>

            <TouchableOpacity
              onPress={handleCreateCourse}
              className="bg-blue-500 p-4 rounded-lg items-center mt-6"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Tambah</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalBuatMakul(false)}
              className="bg-gray-300 p-4 rounded-lg items-center mt-2"
              disabled={loading}
            >
              <Text className="text-black font-bold text-lg">Batal</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Modal Daftar Dosen */}
        <Modal isVisible={modalDosen} style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            paddingTop: 80,
            width: '90%',
            maxHeight: screenHeight * 0.8,
            flexDirection: 'column',
            justifyContent: 'space-between',
          }} className="shadow-lg">
            <Image
              source={images.kontak}
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-36 h-36"
            />

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Daftar Dosen :</Text>
              {classData?.role === "admin" && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingDosenId(null);
                      setShowAddEditDosenModal(true);
                    }}
                    className="p-2 bg-blue-500 rounded-full"
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
              )}
            </View>

            {dosenListLoading ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={dosenList}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDosenItem}
                    contentContainerStyle={{ paddingVertical: 10, paddingBottom: 50 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 20 }}>
                            <Text>Tidak ada dosen yang ditemukan.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
              onPress={() => setModalDosen(false)}
              className="h-10 bg-red-400 rounded-lg justify-center items-center"
            >
              <Text className="text-white font-semibold">Kembali</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Modal Tambah/Edit Dosen */}
        <Modal
          isVisible={showAddEditDosenModal}
          onBackdropPress={() => setShowAddEditDosenModal(false)}
          style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
        >
            <View style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 24,
                width: '90%',
                maxHeight: screenHeight * 0.7,
            }} className="shadow-lg">
                <Text className="text-xl font-bold mb-4 text-center">
                  {editingDosenId ? "Edit Dosen" : "Tambah Dosen Baru"}
                </Text>

                <TextInput
                    className="bg-white p-3 rounded-lg mb-3 text-base border border-gray-300"
                    placeholder="Nama Dosen"
                    value={newDosenName}
                    onChangeText={setNewDosenName}
                />
                <TextInput
                    className="bg-white p-3 rounded-lg mb-3 text-base border border-gray-300"
                    placeholder="NIP"
                    value={newDosenNip}
                    onChangeText={setNewDosenNip}
                    keyboardType="numeric"
                />
                <TextInput
                    className="bg-white p-3 rounded-lg mb-3 text-base border border-gray-300"
                    placeholder="Nomor WhatsApp (contoh: 62812...)"
                    value={newDosenWhatsAppNumber}
                    onChangeText={setNewDosenWhatsAppNumber}
                    keyboardType="phone-pad"
                />
                <TextInput
                    className="bg-white p-3 rounded-lg mb-6 text-base border border-gray-300"
                    placeholder="URL Gambar Profil (Opsional)"
                    value={newDosenProfileImageUrl}
                    onChangeText={setNewDosenProfileImageUrl}
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    className={`py-3 rounded-lg ${saveDosenLoading ? "bg-gray-400" : "bg-blue-600"} justify-center items-center mb-2`}
                    onPress={handleSaveDosen}
                    disabled={saveDosenLoading}
                >
                    <Text className="text-white font-semibold text-lg">
                        {saveDosenLoading ? "Menyimpan..." : (editingDosenId ? "Simpan Perubahan" : "Tambahkan Dosen")}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="py-3 bg-gray-200 rounded-lg justify-center items-center"
                    onPress={() => {
                        setShowAddEditDosenModal(false);
                        setEditingDosenId(null);
                    }}
                    disabled={saveDosenLoading}
                >
                    <Text className="text-gray-700 font-semibold">Batal</Text>
                </TouchableOpacity>
            </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default ClassesScreen;