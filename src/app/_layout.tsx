import { useTheme } from '@/hooks/use-theme';
import { Stack } from 'expo-router';

export default function RootLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        // hide native header — we render consistent headers inside screens
        headerShown: false,
      }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="create-menu" options={{ title: 'Create Menu' }} />
      <Stack.Screen name="join-menu" options={{ title: 'Join Menu' }} />
      <Stack.Screen name="menu-created" options={{ title: 'Menu Created' }} />
      <Stack.Screen name="rate-menu" options={{ title: 'Rate Menu' }} />
      <Stack.Screen name="results" options={{ title: 'Results' }} />
    </Stack>
  );
}
