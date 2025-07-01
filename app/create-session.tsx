import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Alert, ScrollView, SafeAreaView, Switch, ActivityIndicator } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';

const CreateSessionScreen = () => {
  const { course_id, session_count } = useLocalSearchParams();
  const router = useRouter();
  
  const nextSessionNumber = Number(session_count || 0) + 1;
  const [topic, setTopic] = useState(`Pertemuan ke-${nextSessionNumber}: `);
  const [sessionDate, setSessionDate] = useState(new Date());
  
  const [hasAssignment, setHasAssignment] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState(new Date());

  const [pickerInfo, setPickerInfo] = useState<{ mode: 'date' | 'datetime', target: 'session' | 'deadline' } | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (event: DateTimePickerEvent, selectedValue?: Date) => {
    if (event.type === 'set' && selectedValue) {
      if (pickerInfo?.target === 'session') setSessionDate(selectedValue);
      else if (pickerInfo?.target === 'deadline') setAssignmentDeadline(selectedValue);
    }
    setPickerInfo(null);
  };
  
  // ✅ LOGIKA DISINI JADI LEBIH SEDERHANA
  const handleSave = async () => { 
    if (!topic.trim()) {
      Alert.alert("Error", "Topik tidak boleh kosong.");
      return;
    }
    
    setLoading(true);

    const { error } = await supabase
      .from('course_sessions')
      .insert({
        course_id: course_id,
        session_date: sessionDate.toISOString(),
        topic: topic,
        assignment_details: hasAssignment ? assignmentDetails : null,
        assignment_deadline: hasAssignment ? assignmentDeadline.toISOString() : null,
      });

    setLoading(false);

    if (error) {
      Alert.alert("Error", `Gagal membuat sesi: ${error.message}`);
    } else {
      Alert.alert("Sukses", "Sesi baru berhasil dibuat dan tugas telah dibagikan ke anggota.");
      router.back();
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
        <Stack.Screen options={{ title: 'Tambah Sesi Baru' }}/>
        <ScrollView className="p-4 space-y-4">
            <Text className="text-lg font-semibold mb-2">Topik Pertemuan</Text>
            <TextInput value={topic} onChangeText={setTopic} className="bg-white p-4 rounded-lg text-base" />

            <Text className="text-lg font-semibold mt-2 mb-2">Tanggal Pertemuan</Text>
            <TouchableOpacity onPress={() => setPickerInfo({mode: 'date', target: 'session'})} className="bg-white p-4 rounded-lg">
                <Text className="text-base">{sessionDate.toLocaleDateString('id-ID', { dateStyle: 'full' })}</Text>
            </TouchableOpacity>
            
            <View className="flex-row items-center justify-between mt-2 bg-white p-4 rounded-lg">
                <Text className="text-lg">Ada Tugas?</Text>
                <Switch value={hasAssignment} onValueChange={setHasAssignment} />
            </View>

            {hasAssignment && (
                <View className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Text className="text-lg font-semibold mb-2">Detail Tugas</Text>
                    <TextInput value={assignmentDetails} onChangeText={setAssignmentDetails} multiline className="bg-white p-3 h-24 rounded-lg" style={{textAlignVertical: 'top'}} />
                    <Text className="text-lg font-semibold mt-4 mb-2">Deadline Tugas</Text>
                    <TouchableOpacity onPress={() => setPickerInfo({mode: 'datetime', target: 'deadline'})} className="bg-white p-4 rounded-lg">
                        <Text className="text-base">{assignmentDeadline.toLocaleString('id-ID')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {pickerInfo && (
              <DateTimePicker 
                value={pickerInfo.target === 'session' ? sessionDate : assignmentDeadline} 
                mode={pickerInfo.mode === 'datetime' ? 'date' : pickerInfo.mode} // prevent crash
                display="default" 
                onChange={onChange}
              />
            )}

            
            <TouchableOpacity onPress={handleSave} className="bg-blue-500 p-4 rounded-lg items-center mt-4 mb-8" disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Simpan Sesi</Text>}
            </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );
};

export default CreateSessionScreen;