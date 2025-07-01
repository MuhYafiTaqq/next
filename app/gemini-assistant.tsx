import React, { useState, useRef } from 'react';
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
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

// Tipe data untuk setiap pesan
interface Message {
  id: string;
  role: 'user' | 'model'; // Gemini menggunakan 'model' bukan 'assistant'
  content: string;
}

const ChatScreenWithGemini = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'Hello! I am powered by Google Gemini. How can I help you?',
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

    // 2. Siapkan data untuk dikirim ke Gemini API
    const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    // ✅ PERBAIKAN: Gunakan model yang lebih baru dan direkomendasikan
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

    // ✅ PERBAIKAN: Format payload yang lebih sederhana dan benar
    const payload = {
        contents: updatedMessages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }))
    };

    try {
      // 3. Panggil Gemini API menggunakan fetch
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || "Something went wrong");
      }

      const data = await response.json();
      
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (responseText) {
        const assistantMessage: Message = {
          id: 'gemini_' + Date.now().toString(),
          role: 'model',
          content: responseText.trim(),
        };
        // 4. Tambahkan respon dari AI ke state
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      } else {
        // Ini terjadi jika Gemini merespon dengan alasan keamanan (safety ratings)
        throw new Error('No valid response from Gemini. The content might have been blocked.');
      }
    } catch (error) {
      let errorMessageString = "An unexpected error occurred.";
      if (error instanceof Error) {
          errorMessageString = error.message;
      }
      console.error("Error calling Gemini API:", errorMessageString);
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
        <Text className="text-2xl font-bold text-center my-4 text-gray-800">Gemini Assistant</Text>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
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
            <Text className="ml-2 text-gray-500">Gemini is thinking...</Text>
          </View>
        )}

        <View className="flex-row items-center p-4 border-t border-gray-200">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full py-3 px-5 border border-gray-300"
            value={input}
            onChangeText={setInput}
            placeholder="Type your message to Gemini..."
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

export default ChatScreenWithGemini;
