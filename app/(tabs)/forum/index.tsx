import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, ListRenderItem, Alert } from 'react-native';
import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PostCard, { Post } from '@/components/PostCard'; // Impor tipe Post juga
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useAuth } from '@/context/Auth';
import Modal from 'react-native-modal';

import CreatePostModal from './CreatePostModal';

const FeedScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [mode, setMode] = useState(false)
  const [modalPost, setModalPost] = useState(false)

  const { session } = useAuth(); // <-- Dapatkan sesi pengguna saat ini

  // Gunakan useCallback untuk memoize fungsi
const fetchPosts = React.useCallback(async () => { // Tetap async dan useCallback
    setLoading(true);
    let data = null;
    let error = null;

    if (mode && session?.user?.id) {
      // Logika ambil post saya
      const { data: myPostsData, error: myPostsError } = await supabase
        .from('posts')
        .select(`id, content, created_at, user_id, is_anonymous, profiles (username, avatar_url), likes (user_id), comments (id)`)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      data = myPostsData;
      error = myPostsError;
    } else {
      // Logika ambil semua post
      const { data: allPostsData, error: allPostsError } = await supabase.rpc('get_posts_with_details');
      data = allPostsData;
      error = allPostsError;
    }

    if (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Gagal memuat postingan: ' + error.message); // Gunakan Alert.alert agar muncul di UI
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  }, [mode, session?.user?.id]); // Dependensi untuk fetchPosts


  // Cara paling singkat dan benar untuk memanggil async function di useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      fetchPosts(); // Cukup panggil saja fungsi async yang sudah di-memoize
      // Tidak perlu return cleanup jika tidak ada cleanup spesifik
    }, [fetchPosts]) // Dependensi: fetchPosts itu sendiri
  );

  const renderPostItem: ListRenderItem<Post> = ({ item }) => (
    <PostCard post={item} onUpdate={fetchPosts} />
  );

  if (loading && posts.length === 0) {
    return <View className="flex-1 justify-center"><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row justify-between items-center bg-white shadow-sm">
        <TouchableOpacity className='w-1/2' onPress={() => setMode(false)}>
          <View className={`justify-center items-center py-4 ${mode ? "" : "border-b"}`}>
            <Text className={`text-md ${mode ? "" : "font-bold"}`}>
              Untuk Anda
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity className='w-1/2' onPress={() => setMode(true)}>
          <View className={`justify-center items-center py-4 ${mode ? "border-b" : ""}`}>
            <Text className={`text-md ${mode ? "font-bold" : ""}`}>
              Post Anda
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className='pb-10'>
        <FlatList
        className='px-6'
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPostItem}
          onRefresh={fetchPosts}
          refreshing={loading}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-gray-500">Belum ada postingan.</Text>
              <Text className="text-gray-500">Jadilah yang pertama memulai cerita!</Text>
            </View>
          }
        />
      </View>
      <TouchableOpacity
        className='absolute bottom-10 right-6 py-3 px-6 justify-center items-center bg-white rounded-full flex-row gap-4 shadow-xl border border-black/20'
        onPress={() => setModalPost(true)}
      >
        <Ionicons name="add-outline" size={28} />
        <Text className='font-bold text-xl'>Create Post</Text>
      </TouchableOpacity>

      <CreatePostModal 
        isVisible={modalPost}
        onClose={() => setModalPost(false)}
        onPostCreated={() => fetchPosts()}
      />

    </SafeAreaView>
  );
};

export default FeedScreen;
