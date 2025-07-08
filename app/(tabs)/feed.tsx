import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, ListRenderItem } from 'react-native';
import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PostCard, { Post } from '@/components/PostCard'; // Impor tipe Post juga

const FeedScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
    const router = useRouter();

  // Gunakan useCallback untuk memoize fungsi
  const fetchPosts = useCallback(() => {
    const loadData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_posts_with_details');
      if (error) {
        console.error('Error fetching posts:', error);
        alert('Gagal memuat postingan.');
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };
    
    loadData();
  }, []);
  
  // Panggil fungsi yang sudah di-memoize di dalam useFocusEffect
  useFocusEffect(fetchPosts);

  const renderPostItem: ListRenderItem<Post> = ({ item }) => (
    <PostCard post={item} onUpdate={fetchPosts} />
  );

  if (loading && posts.length === 0) {
    return <View className="flex-1 justify-center"><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row justify-between items-center p-4 bg-white shadow-sm">
        <Text className="text-2xl font-bold">Feed Komunitas</Text>

        <Link href="/create-post" asChild>
            <TouchableOpacity>
                <Ionicons name="add-circle" size={32} color="#1F2937" />
            </TouchableOpacity>
        </Link>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPostItem}
        onRefresh={fetchPosts}
        refreshing={loading}
        contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 8, paddingBottom: 50 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-gray-500">Belum ada postingan.</Text>
            <Text className="text-gray-500">Jadilah yang pertama memulai cerita!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default FeedScreen;
