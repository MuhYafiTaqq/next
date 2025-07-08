import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';
import PostCard, { Post } from '@/components/PostCard'; // Impor PostCard untuk menampilkan post utama
import { Ionicons } from '@expo/vector-icons';

// Tipe untuk objek komentar
type Comment = {
  id: number;
  content: string;
  created_at: string;
  profiles: { // Kita akan join untuk mendapatkan info penulis komentar
    username: string;
    avatar_url: string | null;
  }
};

const PostDetailScreen = () => {
  const { id: postId } = useLocalSearchParams();
  const { session } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPostAndComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);

    const { data: postData, error: postError } = await supabase
      .rpc('get_posts_with_details')
      .eq('id', postId)
      .single();

    if (postError) {
        console.error('Error fetching post details:', postError);
        setPost(null); 
    } else {
        setPost(postData as Post | null);
    }

    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (commentsError) console.error('Error fetching comments:', commentsError);
    else setComments(commentsData || []);

    setLoading(false);
  }, [postId]);
  
  useFocusEffect(
    useCallback(() => {
        fetchPostAndComments();
    }, [fetchPostAndComments])
  );

  const handleAddComment = async () => {
    if (newComment.trim() === '' || !session?.user || !postId) return;

    const { error } = await supabase.from('comments').insert({
      content: newComment.trim(),
      post_id: postId,
      user_id: session.user.id,
    });

    if (error) {
      alert('Gagal mengirim komentar: ' + error.message);
    } else {
      setNewComment('');
      fetchPostAndComments();
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" className="flex-1" />;
  }

  if (!post) {
    return <Text className="text-center mt-10">Postingan tidak ditemukan.</Text>;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Postingan' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={160}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 50 }}
          ListHeaderComponent={
            <View className="p-2">
              {/* ✅ DI SINI KITA MENAMBAHKAN PROP isDetailPage */}
              <PostCard post={post} onUpdate={fetchPostAndComments} isDetailPage={true} />
              <Text className="text-lg font-bold mt-4 px-2">Komentar</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row p-3 mx-4 my-1 bg-white rounded-lg shadow-sm">
              <Image 
                source={{ uri: item.profiles.avatar_url || 'https://placehold.co/100' }} 
                className="w-10 h-10 rounded-full bg-gray-200"
              />
              <View className="ml-3 flex-1">
                <Text className="font-bold">{item.profiles.username}</Text>
                <Text className="text-gray-700">{item.content}</Text>
              </View>
            </View>
          )}
        />

        <View className="flex-row items-center p-2 border-t border-gray-200 bg-white">
          <TextInput
            placeholder="Tulis komentar..."
            value={newComment}
            onChangeText={setNewComment}
            className="flex-1 bg-gray-100 rounded-full py-3 px-5"
          />
          <TouchableOpacity onPress={handleAddComment} className="p-2">
            <Ionicons name="send" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PostDetailScreen;
