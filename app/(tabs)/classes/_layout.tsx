import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function ClassesLayout() {
  return (
    <>
      <StatusBar backgroundColor="white" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            header: () => (
              <>
                <View className="py-4 px-6 flex justify-center items-center bg-white">
                  <Text className="text-2xl text-primary font-bold">
                    Class Manajemen
                  </Text>
                </View>
              </>
            ),
          }}
        />
        <Stack.Screen
          name="course/[id]"
          options={{
            headerShown: true,
            header: () => (
              <>
                <View className="py-4 px-6 flex-row items-center bg-white">
                  {/* Tombol Kembali */}
                  {/* Memastikan tombol hanya muncul jika ada history untuk kembali */}
                  {router.canGoBack() && (
                    <TouchableOpacity
                      onPress={() => router.back()} // Menggunakan router.back() untuk navigasi kembali
                      className="absolute left-4" // Atur posisi tombol di kiri
                    >
                      <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                  )}

                  {/* Teks Header (di tengah) */}
                  <View className="flex-1 justify-center items-center">
                    <Text className="text-2xl text-primary font-bold">
                      Class Manajemen
                    </Text>
                  </View>
                </View>
              </>
            ),
          }}
        />
      </Stack>
    </>
  );
}
