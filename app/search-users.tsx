import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Sesuaikan path ke file supabase Anda
import { useAuth } from "@/context/Auth"; // Sesuaikan path ke AuthContext Anda
import { useRouter } from "expo-router";
import { Stack } from "expo-router";

// Tipe untuk objek profil hasil pencarian
type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
};

const SearchUsersScreen = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

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

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Konfigurasi Header */}
      <Stack.Screen options={{ title: "Cari Pengguna Baru" }} />

      <View className="p-4 border-b border-gray-200">
        <TextInput
          placeholder="Ketik username untuk memulai chat..."
          value={query}
          onChangeText={setQuery}
          className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-base"
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
    </SafeAreaView>
  );
};

export default SearchUsersScreen;
