import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, ListRenderItem, Keyboard, TextInput } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Sesuaikan path
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { icons } from '@/constants/icons';
import { useAuth } from '@/context/Auth';

// Definisikan tipe data untuk setiap item percakapan
type Conversation = {
  conversation_id: number;
  other_participant_username: string;
  other_participant_avatar: string | null;
  last_message_content: string | null;
  last_message_time?: string | null;
};

// Tipe untuk objek profil hasil pencarian
type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
};

// Tipe untuk psychologist
interface Psychologist {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  time: string;
  avatar: string;
}

// Data psychologist
const initialPsychologists: Psychologist[] = [
  {
    id: 'demo-1',
    name: 'Dr. Demo Psychologist',
    specialization: 'Clinical Psychologist',
    rating: 5.0,
    time: '09.00 am - 05.00 pm',
    avatar: 'https://randomuser.me/api/portraits/men/99.jpg',
  },
];

const ChatListScreen = () => {
  // Beri tahu useState tipe data yang akan disimpannya
  const [conversations, setConversations] = useState<Conversation[]>([]); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [ users, setUsers ] = useState(true);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([
     {
       id: '1',
       name: 'Dr. Sarah Johnson',
       specialization: 'Psikologi Klinis',
       rating: 4.8,
       time: '10 menit',
       avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'
     },
     {
       id: '2',
       name: 'Dr. Michael Chen',
       specialization: 'Terapi Kognitif Perilaku',
       rating: 4.9,
       time: '5 menit',
       avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'
     },
     {
       id: '3',
       name: 'Dr. Emily Rodriguez',
       specialization: 'Terapi Keluarga',
       rating: 4.7,
       time: '15 menit',
       avatar: 'https://images.unsplash.com/photo-1594824388853-e0c8b8b8b8b8?w=150&h=150&fit=crop&crop=face'
     }
   ]);
  const [showAddPsychologist, setShowAddPsychologist] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newAvatar, setNewAvatar] = useState('');

  //////////////////////////////////////////////////////////////////

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const { session } = useAuth();

  // useEffect untuk melakukan pencarian dengan debouncing
  useEffect(() => {
    // Debouncing: Tunda pencarian selama 500ms setelah pengguna berhenti mengetik
    const timer = setTimeout(() => {
      // Hanya lakukan pencarian jika query lebih dari 2 karakter
      if (query.trim().length > 2) {
        performSearch();
      } else {
        setResults([]); // Kosongkan hasil jika query pendek
      }
    }, 500);

    return () => clearTimeout(timer); // Bersihkan timer jika pengguna mengetik lagi
  }, [query]);

  const performSearch = async () => {
      if (!session?.user) return;
      setLoading(true);
      // Cari di tabel 'profiles'
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${query}%`) // Cari username yang mengandung query
        .neq("id", session.user.id); // Kecualikan diri sendiri dari hasil pencarian
  
      if (error) {
        console.error("Error searching users:", error);
      } else {
        setResults(data || []);
      }
      setLoading(false);
    };
  
    // BENAR ✅
    const handleSelectUser = async (targetUser: Profile) => {
      Keyboard.dismiss();
      try {
        const { data: conversation_id, error } = await supabase.rpc(
          "find_or_create_conversation",
          { target_user_id: targetUser.id }
        );
  
        if (error) throw error;
  
        if (conversation_id) {
          // Gunakan format objek untuk navigasi
          router.replace({
            pathname: "/chat/[id]",
            params: { id: conversation_id.toString() }, // 'id' harus sesuai nama file [id].tsx
          });
        }
      } catch (error) {
        console.error("Error starting conversation:", error);
        alert("Gagal memulai percakapan.");
      }
    };

  // Function to handle adding psychologist
  const handleAddPsychologist = () => {
    if (!newName.trim() || !newSpecialization.trim()) {
      alert('Please fill all fields');
      return;
    }
    setPsychologists([
      ...psychologists,
      {
        id: `custom-${Date.now()}`,
        name: newName,
        specialization: newSpecialization,
        rating: 5.0,
        time: '09.00 am - 05.00 pm',
        avatar: newAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
      },
    ]);
    setShowAddPsychologist(false);
    setNewName('');
    setNewSpecialization('');
    setNewAvatar('');
  };

    ///////////////////////////////////////////////////////////////////////////////////
  

  useFocusEffect(
    useCallback(() => {
      const fetchConversations = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_user_conversations');

        if (error) {
          console.error('Error fetching conversations:', error);
        } else {
          setConversations(data || []); // Beri nilai default array kosong jika data null
        }
        setLoading(false);
      };

      fetchConversations();
    }, [])
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  // ✅ SOLUSI: Definisikan tipe untuk renderItem di sini
  const renderConversationItem: ListRenderItem<Conversation> = ({ item }) => (
    <TouchableOpacity 
      className="flex-row items-center p-4 border-b border-gray-100"
      onPress={() => router.push({
        pathname: "/chat/[id]",
        params: { id: item.conversation_id.toString() }
      })}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.other_participant_avatar || 'https://placehold.co/100' }} 
        className="w-14 h-14 rounded-full bg-gray-200"
      />
      <View className="ml-4 flex-1 flex-row items-center justify-between">
        <View style={{flex: 1}}>
          <Text className="text-base font-bold text-gray-800" numberOfLines={1}>{item.other_participant_username}</Text>
          <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
            {item.last_message_content || 'Mulai percakapan...'}
          </Text>
        </View>
        {item.last_message_time && (
          <Text className="text-xs text-gray-400 ml-2" style={{minWidth: 60, textAlign: 'right'}}>
            {formatTime(item.last_message_time)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 mb-6 mt-6">
        <View className="flex-row items-center bg-orange-50 p-5 rounded-xl">
          {/* Gambar Icon */}
          <View className="w-16 h-16 justify-center items-center mr-4">
            <Image source={icons.ai} className="w-full h-full" resizeMode="contain" />
          </View>

          {/* Teks dan Icon Arah */}
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-orange-600 text-lg font-medium leading-tight flex-1 pr-2">
              TemanDengar : Saya adalah AI yang menjadi ruang aman bagi setiap cerita Anda.
            </Text>
            <TouchableOpacity onPress={() => router.push("/gemini-assistant")}>
              <Ionicons
                name="arrow-forward-circle"
                size={40}
                color="orange"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="mb-6 px-6">
        <View className="flex-row justify-between border rounded-xl border-primary">
          <TouchableOpacity
            onPress={() => setUsers(false)}
            className={`flex-1 py-3 rounded-xl flex-row justify-center items-center ${users ? "bg-white" : "bg-primary"}`}
          >
            <Ionicons name="people-circle" size={22} color={users ? "#000" : "#fff"} style={{marginRight: 8}} />
            <Text 
              className={`text-center font-bold ${users ? "text-black" : "text-white"}`}
            >
              Teman
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setUsers(true)}
            className={`flex-1 py-3 rounded-xl flex-row justify-center items-center ${users ? "bg-primary" : "bg-white"}`}
          >
            <Ionicons name="medkit" size={22} color={users ? "#fff" : "#000"} style={{marginRight: 8}} />
            <Text
              className={`text-center font-bold ${users ? "text-white" : "text-black"}`}
            >
              Psikolog
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {users ? (
        // Psychologist Section
        <View className="flex-1">
          {/* Search Box untuk Psikolog */}
          <View className="px-6 mb-2">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari psikolog untuk memulai konsultasi..."
              className="bg-gray-100 rounded-xl px-4 py-3 text-base text-gray-800 font-medium"
              placeholderTextColor="#A0AEC0"
              style={{marginBottom: 0, fontSize: 16, fontWeight: '500'}}
            />
          </View>
          
          {/* Riwayat Chat Psikolog */}
           {(() => {
             const psychologistChats = conversations.filter(conv => 
               conv.other_participant_username.toLowerCase().includes('dr.') || 
               conv.other_participant_username.toLowerCase().includes('psikolog')
             );
             return psychologistChats.length > 0 && (
               <View className="px-6 mb-4">
                 <Text className="text-lg font-bold mb-2">Riwayat Chat Psikolog</Text>
                 <FlatList
                   data={psychologistChats}
                   keyExtractor={(item) => `psych-${item.conversation_id.toString()}`}
                   renderItem={renderConversationItem}
                   scrollEnabled={false}
                 />
               </View>
             );
           })()}
          
          {/* Rekomendasi Psikolog */}
          <View className="flex-1 px-6">
            <Text className="text-xl font-bold mb-4">Rekomendasi Psikolog</Text>
            <FlatList
              data={psychologists}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity className="flex-row items-center bg-yellow-100 rounded-xl p-4 mb-3 shadow-sm">
                  <Image source={{ uri: item.avatar }} className="w-16 h-16 rounded-full bg-gray-200 mr-4" />
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
                    <Text className="text-xs text-gray-700 mb-1">{item.specialization}</Text>
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="star" size={14} color="#FBBF24" />
                      <Text className="ml-1 text-xs font-semibold text-gray-700">{item.rating.toFixed(2)}</Text>
                      <Ionicons name="time-outline" size={14} color="#4B5563" style={{ marginLeft: 10 }} />
                      <Text className="ml-1 text-xs text-gray-700">{item.time}</Text>
                    </View>
                  </View>
                  <TouchableOpacity className="ml-2 bg-blue-500 px-3 py-2 rounded-lg" onPress={() => alert(`Mulai konsultasi dengan ${item.name}`)}>
                    <Text className="text-white font-bold">Chat</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              ListFooterComponent={
                showAddPsychologist ? (
                  <View className="bg-white p-4 rounded-xl shadow mt-4 border border-gray-200">
                    <Text className="font-bold mb-2">Tambah Psikolog</Text>
                    <TextInput
                      placeholder="Nama"
                      value={newName}
                      onChangeText={setNewName}
                      className="border border-gray-300 rounded-lg p-2 mb-2"
                    />
                    <TextInput
                      placeholder="Spesialisasi"
                      value={newSpecialization}
                      onChangeText={setNewSpecialization}
                      className="border border-gray-300 rounded-lg p-2 mb-2"
                    />
                    <TextInput
                      placeholder="URL Avatar (opsional)"
                      value={newAvatar}
                      onChangeText={setNewAvatar}
                      className="border border-gray-300 rounded-lg p-2 mb-2"
                    />
                    <TouchableOpacity className="bg-green-500 p-2 rounded-lg mb-2" onPress={handleAddPsychologist}>
                      <Text className="text-white text-center font-bold">Tambah</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-gray-300 p-2 rounded-lg" onPress={() => setShowAddPsychologist(false)}>
                      <Text className="text-black text-center font-bold">Batal</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity className="bg-blue-500 p-4 rounded-lg mt-4" onPress={() => setShowAddPsychologist(true)}>
                    <Text className="text-white text-center font-bold">Tambah Psikolog</Text>
                  </TouchableOpacity>
                )
              }
            />
          </View>
        </View>
      ) : (
        // Friends Section
        <>
          <View className="px-6 mb-2">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ketik username untuk memulai chat..."
              className="bg-gray-100 rounded-xl px-4 py-3 text-base text-gray-800 font-medium"
              placeholderTextColor="#A0AEC0"
              style={{marginBottom: 0, fontSize: 16, fontWeight: '500'}}
            />
          </View>
          {query.trim().length > 2 ? (
            loading ? (
              <ActivityIndicator size="large" className="mt-10" />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectUser(item)}
                    className="flex-row items-center p-4 border-b border-gray-100"
                  >
                    <Image
                      source={{ uri: item.avatar_url || "https://placehold.co/100" }}
                      className="w-12 h-12 rounded-full bg-gray-200"
                    />
                    <Text className="ml-4 text-lg font-semibold">
                      {item.username}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={null}
                keyboardShouldPersistTaps="handled"
              />
            )
          ) : (
            conversations.length > 0 ? (
              <FlatList
                data={conversations}
                keyExtractor={(item) => item.conversation_id.toString()}
                renderItem={renderConversationItem}
              />
            ) : (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-500">Anda belum memiliki percakapan.</Text>
                <Text className="text-gray-500">Mulai chat baru dengan menekan ikon di atas.</Text>
              </View>
            )
          )}
        </>
      )}
      <TouchableOpacity onPress={() => router.push('/search-users')} className='absolute bottom-5 right-5 h-16 w-16 rounded-full bg-green-400 justify-center items-center'>
        <Ionicons name="add" size={30} color="black" ></Ionicons>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChatListScreen;


function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    // Hari ini, tampilkan jam:menit
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    // Tampilkan tanggal singkat
    return date.toLocaleDateString();
  }
}