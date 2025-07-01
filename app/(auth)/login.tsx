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
import { supabase } from "../../lib/supabase";
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
      router.replace("/home");
      // Kita tidak perlu setLoading(false) di sini karena layar akan segera berganti
    }
  }

  return (
    <SafeAreaView className="flex flex-col h-full bg-slate-100">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />


      <View className="flex flex-col mt-12">
        <View className="flex items-center border-1 border-solid border-red-500">
          <Image
            source={images.login}
            className="w-72 h-72 border-1 border-solid border-red-500"
          />
        </View>

        <View className="w-4/5 my-6 mx-auto" />

        <View className="flex justify-center px-10">
          <Text className="text-3xl font-bold text-gray-800 mb-6">
            Login to Your Account
          </Text>
          {/* Form Container */}
          <View>
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

            {/* Tampilkan pesan error inline jika ada */}
            {errorMsg ? (
              <Text className="text-red-500 text-center mb-4">{errorMsg}</Text>
            ) : null}

            <TouchableOpacity
              className={`py-4 rounded-lg shadow-md ${
                loading ? "bg-gray-400" : "bg-blue-600 active:bg-blue-700"
              }`}
              onPress={signInWithEmail}
              disabled={loading}
            >
              <Text className="text-white text-center font-bold text-lg">
                {loading ? "Loading..." : "Masuk"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Link ke halaman Register */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-600">Belum punya akun? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-bold">Daftar di sini</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
