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
};

// Tipe untuk objek profil hasil pencarian
type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
};

const ChatListScreen = () => {
  // Beri tahu useState tipe data yang akan disimpannya
  const [conversations, setConversations] = useState<Conversation[]>([]); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [ users, setUsers ] = useState(true);

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
      <View className="ml-4 flex-1">
        <Text className="text-base font-bold text-gray-800" numberOfLines={1}>{item.other_participant_username}</Text>
        <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
          {item.last_message_content || 'Mulai percakapan...'}
        </Text>
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
            className={`flex-1 py-3 rounded-xl ${
              users ? "bg-white" : "bg-primary"
            }`}
            >
            <Text 
            className={`text-center font-bold ${
              users ? "text-black" : "text-white"
              }`}
            >
              Find Friends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setUsers(true)}
            className={`flex-1 py-3 rounded-xl ${
              users ? "bg-primary" : "bg-white"
            }`}
          >
            <Text
            className={`text-center font-bold ${
              users ? "text-white" : "text-black"
            }`}
            >
              Message Psychologist
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-3 px-6">
        <TextInput
          placeholder="Ketik username untuk memulai chat..."
          value={query}
          onChangeText={setQuery}
          className="bg-gray-100 rounded-xl text-base"
          autoFocus={true}
        />
      </View>
      
            {loading ? (
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
                ListEmptyComponent={
                  <View className="flex-1 justify-center items-center mt-20">
                    <Text className="text-gray-500 text-center px-10">
                      {query.length > 2
                        ? "Pengguna tidak ditemukan."
                        : "Ketik minimal 3 huruf untuk mencari pengguna."}
                    </Text>
                  </View>
                }
                keyboardShouldPersistTaps="handled"
              />
            )}

      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversation_id.toString()}
          // Gunakan fungsi yang sudah diberi tipe
          renderItem={renderConversationItem} 
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Anda belum memiliki percakapan.</Text>
          <Text className="text-gray-500">Mulai chat baru dengan menekan ikon di atas.</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => router.push('/search-users')} className='absolute bottom-5 right-5 h-16 w-16 rounded-full bg-green-400 justify-center items-center'>
        <Ionicons name="chatbubble-ellipses" size={30} color="black" ></Ionicons>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChatListScreen;