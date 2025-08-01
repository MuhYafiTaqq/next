// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://idyfjtsumrcuhhbskzrg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkeWZqdHN1bXJjdWhoYnNrenJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MzY4NjEsImV4cCI6MjA2NTExMjg2MX0.rJud8azTE_AlnGuIyiKRxKqQkIWLJ_RjK8jieKvta9M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});