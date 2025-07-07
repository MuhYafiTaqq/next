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
  const [confirmPassword, setConfirmPassword] = useState(""); // Tambahkan state untuk konfirmasi password
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  async function signUpWithEmail() {
    setLoading(true);
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Password dan konfirmasi password tidak cocok!");
      setLoading(false);
      return;
    }
    if (!agreeToTerms) {
      setErrorMsg("Anda harus menyetujui syarat & ketentuan!");
      setLoading(false);
      return;
    }

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
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1" // Ambil seluruh tinggi
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Sesuaikan offset jika perlu
      >
        <View className="flex-1 px-6 pt-20 pb-8">
          <View className="flex-row items-center mb-6">
            <Text className="flex-1 text-center text-3xl font-bold text-primary">
              Create Students Account
            </Text>
          </View>

          <View className="flex-col items-center my-12">
            <Image
              source={images.login} // Gunakan gambar ilustrasi untuk register
              className="w-full h-60 rounded-lg object-contain" // Atur ukuran dan gaya
              resizeMode="contain"
            />
          </View>

          <View className="flex-1">
            <TextInput
              className="bg-white p-4 rounded-lg mb-4 text-base border border-gray-300 focus:border-blue-500"
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              className="bg-white p-4 rounded-lg mb-4 text-base border border-gray-300 focus:border-blue-500"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              className="bg-white p-4 rounded-lg mb-4 text-base border border-gray-300 focus:border-blue-500"
              placeholder="Choose a Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              className="bg-white p-4 rounded-lg mb-6 text-base border border-gray-300 focus:border-blue-500"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              className="flex-row items-center mb-6"
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              activeOpacity={0.7}
            >
              <View className={`w-6 h-6 rounded border border-gray-400 justify-center items-center mr-3 ${agreeToTerms ? 'bg-primary' : 'bg-white'}`}>
                {agreeToTerms && (
                  <Text className="text-white text-lg font-bold">✓</Text>
                )}
              </View>
              <Text className="text-gray-600">I agree with terms of use</Text>
            </TouchableOpacity>

                            {/* Tampilkan pesan error inline jika ada */}
            {errorMsg ? (
              <Text className="text-red-500 text-center mb-4">{errorMsg}</Text>
            ) : null}

            <TouchableOpacity
              className={`py-4 rounded-lg shadow-md ${
                loading || !agreeToTerms ? "bg-gray-400" : "bg-blue-600 active:bg-blue-700"
              } mb-4`} // Tombol utama, margin bottom
              onPress={signUpWithEmail}
              disabled={loading || !agreeToTerms}
            >
              <Text className="text-white text-center font-bold text-lg">
                {loading ? "Loading..." : "Sign up"}
              </Text>
            </TouchableOpacity>

            {/* Pemisah "or" */}
            <View className="flex-row items-center justify-center mb-4">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-gray-500">or</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Tombol Sign up with Google */}
            <TouchableOpacity
              className="py-4 bg-white border border-gray-300 rounded-lg items-center flex-row justify-center"
              // onPress={() => console.log("Sign up with Google")} // Tambahkan fungsi Google sign-up
              disabled={loading}
            >
              <Image
                source={images.google} // Pastikan Anda memiliki images.google
                className="w-6 h-6 mr-3"
                resizeMode="contain"
              />
              <Text className="text-gray-700 text-center font-bold text-lg">
                Sign up with Google
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
