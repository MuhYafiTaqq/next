import { View, Text, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/Auth';

export interface Post {
  id: number;
  content: string;
  image_url?: string;
  author_username: string;
  author_avatar_url?: string;
  like_count: number;
  comment_count: number;
  liked_by_user: boolean;
  is_anonymous: boolean;
}

// Tambahkan isDetailPage ke props
interface PostCardProps {
  post: Post;
  onUpdate: () => void;
  isDetailPage?: boolean; // Prop baru, opsional
}
const ANONYMOUS_ICON_URL = 'https://i.pinimgproxy.com/?url=aHR0cHM6Ly9jZG4taWNvbnMtcG5nLmZsYXRpY29uLmNvbS8yNTYvNjgzMC82ODMwMzY2LnBuZw==&ts=1751952775&sig=595ce933de9f98ecbca126912ed75ed0b97c411bed7a7a65a0fb971addfe81b6';

const PostCard = ({ post, onUpdate, isDetailPage = false }: PostCardProps) => {
  const router = useRouter();
  const { session } = useAuth();
  
  const [isLiked, setIsLiked] = useState<boolean>(post.liked_by_user);
  const [likeCount, setLikeCount] = useState<number>(post.like_count);

  const handleLike = async () => {
    if (!session?.user) return;
    
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    const { error } = await supabase.rpc('toggle_like', { target_post_id: post.id });

    if (error) {
      setIsLiked(post.liked_by_user);
      setLikeCount(post.like_count);
      console.error('Error toggling like:', error);
    }
  };

  // Fungsi baru untuk menangani klik pada post atau ikon komentar
  const handlePress = () => {
    // Jika BUKAN halaman detail, maka lakukan navigasi
    if (!isDetailPage) {
      router.push({ pathname: `/post/[id]`, params: { id: post.id } });
    }
    // Jika SUDAH di halaman detail, tidak melakukan apa-apa
  };

    // Tentukan URL avatar berdasarkan is_anonymous
  const avatarUrl = post.is_anonymous
    ? ANONYMOUS_ICON_URL
    : post.author_avatar_url || 'https://placehold.co/100'; // Fallback jika author_avatar_url kosong

  return (
    <View className="rounded-xl mb-4 border-b border-black/20 py-6">
      <View className='flex-row justify-between'>
        <View className="flex-row items-center mb-3">
          <Image
            source={{ uri: avatarUrl }}
            className="w-10 h-10 rounded-full bg-gray-200"
          />
          <View className="ml-3 justify-center">
              <Text className="font-bold text-base">{post.author_username}</Text>
              <Text className="text-xs text-gray-500">2 jam yang lalu</Text>
          </View>
        </View>
        <TouchableOpacity className='w-10 h-10 justify-center items-center'>
          <Ionicons name="ellipsis-horizontal" size={20} />
        </TouchableOpacity>
      </View>

      <View className='bg-slate-100 p-4 rounded-lg'>
        {/* Gunakan handlePress di sini */}
        <TouchableOpacity onPress={handlePress}>
          <Text className="text-base text-gray-800">{post.content}</Text>
          {post.image_url && (
              <Image source={{ uri: post.image_url }} className="w-full h-48 rounded-lg mb-3 bg-gray-200" />
          )}
        </TouchableOpacity>
      </View>


      <View className="flex-row justify-start items-center border-t border-gray-100 pt-3 gap-8">
        <TouchableOpacity onPress={handleLike} className="flex-row items-center">
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? '#EF4444' : 'gray'} />
          <Text className="ml-2 text-gray-600">{likeCount}</Text>
        </TouchableOpacity>

        {/* Gunakan handlePress di sini juga */}
        <TouchableOpacity onPress={handlePress} className="flex-row items-center">
          <Ionicons name="chatbubble-outline" size={24} color="gray" />
          <Text className="ml-2 text-gray-600">{post.comment_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;
