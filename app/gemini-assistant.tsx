import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Tipe data untuk setiap pesan
interface Message {
  id: string;
  role: 'user' | 'model'; // AI menggunakan 'model' bukan 'assistant'
  content: string;
}

const ChatScreenWithAI = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'Hai! Aku Teman Dengar, sahabatmu yang siap mendengarkan cerita apapun. Mau curhat tentang hari ini? Atau ada yang ingin kamu tanyakan seputar belajar atau hal lainnya? Aku di sini untuk kamu! 😊',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (input.trim().length === 0 || loading) return;

    // 1. Tambahkan pesan pengguna ke state
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    
    // Simpan semua pesan termasuk yang baru untuk dikirim ke API
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // 2. Siapkan data untuk dikirim ke AI API
    const aiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    // ✅ PERBAIKAN: Gunakan model yang lebih baru dan direkomendasikan
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${aiApiKey}`;

    // ✅ PERBAIKAN: Format payload yang lebih sederhana dan benar
    const payload = {
        contents: updatedMessages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }))
    };

    try {
      // 3. Panggil AI API menggunakan fetch
      const systemPrompt = "Kamu adalah Teman Dengar, seorang sahabat dekat yang hangat, empati, dan selalu siap mendengarkan. Kamu memiliki pengetahuan dalam bidang psikologi dan pembelajaran, tapi yang terpenting adalah kamu seperti sahabat yang bisa diajak curhat tentang kehidupan sehari-hari. Berikan respon yang natural, supportif, dan manusiawi. Gunakan bahasa Indonesia yang santai tapi tetap sopan, seperti berbicara dengan teman dekat. Jangan terlalu formal atau terkesan seperti AI. Berikan saran yang praktis dan relevan dengan situasi yang diceritakan.";
       
       // Gabungkan system prompt dengan pesan terakhir
       const lastMessage = updatedMessages[updatedMessages.length - 1];
       const messageWithContext = systemPrompt + "\n\nUser: " + lastMessage.content;
       
       const response = await fetch(apiUrl, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           contents: [{
             parts: [{ text: messageWithContext }]
           }]
         }),
       });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || "Something went wrong");
      }

      const data = await response.json();
      
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (responseText) {
        const assistantMessage: Message = {
          id: 'ai_' + Date.now().toString(),
          role: 'model',
          content: responseText.trim(),
        };
        // 4. Tambahkan respon dari AI ke state
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      } else {
        // Ini terjadi jika AI merespon dengan alasan keamanan (safety ratings)
      throw new Error('No valid response from AI. The content might have been blocked.');
      }
    } catch (error) {
      let errorMessageString = "An unexpected error occurred.";
      if (error instanceof Error) {
          errorMessageString = error.message;
      }
      console.error("Error calling AI API:", errorMessageString);
      const errorMessage: Message = {
        id: 'error_' + Date.now().toString(),
        role: 'model',
        content: `Sorry, an error occurred: ${errorMessageString}`,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Text className="text-2xl font-bold text-center my-4 text-gray-800">---</Text>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 50 }}
          renderItem={({ item }) => (
            <View
              className={`max-w-[80%] rounded-lg p-3 my-2 ${
                item.role === 'user' ? 'bg-blue-500 self-end' : 'bg-gray-200 self-start'
              }`}
            >
              <Text className={item.role === 'user' ? 'text-white' : 'text-black'}>
                {item.content}
              </Text>
            </View>
          )}
        />
        
        {loading && (
          <View className="flex-row items-center justify-start p-4">
            <ActivityIndicator size="small" color="#888" />
            <Text className="ml-2 text-gray-500">Teman Dengar sedang berpikir...</Text>
          </View>
        )}

        <View className="flex-row items-center p-4 border-t border-gray-200">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full py-3 px-5 border border-gray-300"
            value={input}
            onChangeText={setInput}
            placeholder="Ketik pesanmu untuk Teman Dengar..."
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            className={`ml-3 p-3 rounded-full ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
          >
            <Feather name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreenWithAI;
