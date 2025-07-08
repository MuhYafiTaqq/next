import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Sesuaikan path
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/Auth'; // Sesuaikan path
import { Ionicons } from '@expo/vector-icons';

// Definisikan tipe untuk objek pesan
type Message = {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
};

const ChatRoomScreen = () => {
  const { id: conversationId } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fungsi untuk memuat pesan awal
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }); // Urutkan dari yang terlama

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  }, [conversationId]);

  // Memuat pesan saat pertama kali layar dibuka
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Pengaturan untuk Real-time
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Tambahkan pesan baru ke state
          setMessages((currentMessages) => [...currentMessages, payload.new as Message]);
        }
      )
      .subscribe();

    // Cleanup: unsubscribe saat komponen tidak lagi ditampilkan
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Fungsi untuk mengirim pesan
const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !session?.user) return;

    const contentToSend = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      content: contentToSend,
    });

    // TAMBAHKAN BLOK INI UNTUK DEBUGGING
    if (error) {
      // Jika ada error di sini, kemungkinan besar karena RLS Policy belum ada.
      console.error("GAGAL MENGIRIM PESAN:", error);
      alert(`Gagal mengirim: ${error.message}`);
      setNewMessage(contentToSend); // Kembalikan teks jika gagal
    }
    // ------------------------------------
  };

  if (loading) {
    return <ActivityIndicator size="large" className="flex-1" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white" style={{zIndex: 10, elevation: 2}}>
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">Chat</Text>
      </View>
      <View style={{flex: 1}}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}
          keyboardVerticalOffset={90}
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const isMyMessage = item.sender_id === session?.user?.id;
              return (
                <View
                  className={`p-3 rounded-lg my-2 max-w-[75%] ${
                    isMyMessage ? 'bg-blue-500 self-end mr-4' : 'bg-gray-200 self-start ml-4'
                  }`}
                >
                  <Text className={isMyMessage ? 'text-white' : 'text-black'}>
                    {item.content}
                  </Text>
                  <Text className={`text-xs mt-1 ${isMyMessage ? 'text-blue-100 text-right' : 'text-gray-500 text-left'}`}>{formatTime(item.created_at)}</Text>
                </View>
              );
            }}
            className="flex-1"
          />
          <View className="flex-row items-center p-2 border-t border-gray-200">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Ketik pesan..."
              className="flex-1 bg-gray-100 rounded-full py-3 px-5 border border-gray-300"
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              className="ml-3 p-3 bg-blue-500 rounded-full"
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;

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