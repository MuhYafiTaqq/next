import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from "react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase"; // Pastikan path ini benar
import { Link, Stack, router } from "expo-router";
import { images } from "@/constants/images";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // Tambahan untuk username
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function signUpWithEmail() {
    setLoading(true);
    setErrorMsg("");

    // Menggunakan supabase.auth.signUp untuk mendaftarkan pengguna baru
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        // Di sini Anda bisa menambahkan data tambahan yang akan disimpan
        // saat pengguna mendaftar, contohnya username.
        data: {
          username: username,
          // avatar_url: '...default_avatar.png' // contoh lain
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else if (!session) {
      // Jika verifikasi email diaktifkan, sesi tidak akan langsung ada.
      // Anda bisa menampilkan pesan untuk cek email.
      Alert.alert(
        "Pendaftaran Berhasil!",
        "Silakan cek email Anda untuk verifikasi."
      );
    }
    // Jika verifikasi email dinonaktifkan, onAuthStateChange di AuthContext
    // akan otomatis mendeteksi sesi baru dan melakukan redirect.

    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View className="flex justify-center mt-12">
        <View className="flex items-center border-1 border-solid border-red-500">
          <Image
            source={images.login}
            className="w-72 h-72 border-1 border-solid border-red-500"
          />
        </View>

        <View className="w-4/5 my-6 mx-auto" />

        <View className="flex justify-center px-10">
          <Text className="text-3xl font-bold text-gray-800 mb-6">
            Create Your Account
          </Text>

          {/* Form Container */}
          <View>
            <TextInput
              className="bg-white p-4 rounded-lg mb-4 text-base border border-gray-300 focus:border-blue-500"
              placeholder="Username Anda"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              className="bg-white p-4 rounded-lg mb-4 text-base border border-gray-300 focus:border-blue-500"
              placeholder="Email Anda"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              className="bg-white p-4 rounded-lg mb-6 text-base border border-gray-300 focus:border-blue-500"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {errorMsg ? (
              <Text className="text-red-500 text-center mb-4">{errorMsg}</Text>
            ) : null}

            <TouchableOpacity
              className={`py-4 rounded-lg shadow-md ${
                loading ? "bg-gray-400" : "bg-blue-600"
              }`}
              onPress={signUpWithEmail}
              disabled={loading}
            >
              <Text className="text-white text-center font-bold text-lg">
                {loading ? "Mendaftar..." : "Daftar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Link ke halaman Login */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-600">Sudah punya akun? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-bold">Masuk di sini</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
