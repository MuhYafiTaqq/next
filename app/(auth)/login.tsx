import {
  Alert,
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Link, Stack, router } from "expo-router"; // <-- Tambahkan 'router' di sini
import { images } from "@/constants/images";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function signInWithEmail() {
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false); // Hentikan loading jika ada error
    } else {
      // TIDAK ADA ERROR, LAKUKAN REDIRECT MANUAL
      console.log("Login sukses, melakukan redirect manual ke /home...");
      router.replace("/(tabs)/home");
      // Kita tidak perlu setLoading(false) di sini karena layar akan segera berganti
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1" // Ambil seluruh tinggi yang tersedia
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="flex-1 px-6 pt-20 pb-8">
          <View className="flex-row items-center mb-6">
            <Text className="flex-1 text-center text-3xl font-bold text-primary">
              Welcome Back
            </Text>
          </View>

          <View className="flex-col items-center my-12">
            <Image
              source={images.login}
              className="w-full h-60 rounded-lg object-contain"
              resizeMode="contain"
            />
          </View>

          <View className="flex-1 justify-between">
            <View>
              <Text className="font-bold pb-1 text-lg">Email Address</Text>
              <TextInput
                className="bg-white p-4 rounded-lg mb-4 text-base border border-gray-300 focus:border-blue-500"
                placeholder="xxx@gmail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Text className="font-bold pb-1 text-lg">Password</Text>
              <TextInput
                className="bg-white p-4 rounded-lg mb-10 text-base border border-gray-300 focus:border-blue-500"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* Tampilkan pesan error inline jika ada */}
              {errorMsg ? (
                <Text className="text-red-500 text-center mb-4">
                  {errorMsg}
                </Text>
              ) : null}

              <TouchableOpacity
                className={`py-4 rounded-lg shadow-md ${
                  loading ? "bg-gray-400" : "bg-primary" // Gunakan 'bg-primary' dari Tailwind
                } mb-4`}
                onPress={signInWithEmail}
                disabled={loading}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {loading ? "Loading..." : "Log in"}
                </Text>
              </TouchableOpacity>

              {/* Pemisah "or" */}
              <View className="flex-row items-center justify-center mb-4">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500">or</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Tombol Log in with Google */}
              <TouchableOpacity
                className="py-4 bg-white border border-gray-300 rounded-lg items-center flex-row justify-center"
                // onPress={signInWithGoogle} // Un-comment dan implementasikan fungsi ini
                disabled={loading}
              >
                <Image
                  source={images.google}
                  className="w-6 h-6 mr-3"
                  resizeMode="contain"
                />
                <Text className="text-gray-700 text-center font-bold text-lg">
                  Log in with Google
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-center mt-8">
                <Text className="text-gray-600">Don't have an account? </Text>
                {/* PASTIKAN TIDAK ADA SPASI ATAU NEWLINE DI ANTARA Link DAN TouchableOpacity */}
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text className="text-blue-600 font-bold">Sign up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
