
import { Stack } from 'expo-router';
import { StatusBar, Text, View } from 'react-native';

export default function StudyPlannerLayout() {
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
                <View className='py-4 px-6 flex justify-center items-center bg-white'>
                <Text className='text-2xl font-bold'>AI Study Planner</Text>
                </View>
            </>
            ),
            }}
        />
      </Stack>
    </>
  )
}