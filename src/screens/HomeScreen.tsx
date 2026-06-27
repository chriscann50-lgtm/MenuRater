import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ScreenLayout } from './ScreenLayout';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <ScreenLayout
      title="🍽️ MenuRater"
      subtitle="Rate menus with friends in real-time"
    >
      <View style={styles.heroBox}>
        <ThemedText type="small" style={styles.heroText}>
          Choose how you want to get started
        </ThemedText>
      </View>

      <Link href="/create-menu" asChild>
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <View style={styles.buttonContent}>
            <ThemedText type="title" style={styles.buttonEmoji}>✨</ThemedText>
            <ThemedText type="smallBold" style={styles.primaryButtonText}>Create a Menu</ThemedText>
            <ThemedText type="small" style={styles.buttonSubtext}>Start a new session</ThemedText>
          </View>
        </Pressable>
      </Link>

      <Link href="/join-menu" asChild>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          <View style={styles.buttonContent}>
            <ThemedText type="title" style={styles.buttonEmoji}>🔗</ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.text }}>Join a Menu</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Use a join code</ThemedText>
          </View>
        </Pressable>
      </Link>

      <Link href="/results" asChild>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          <View style={styles.buttonContent}>
            <ThemedText type="title" style={styles.buttonEmoji}>📊</ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.text }}>View Results</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Quick access to results</ThemedText>
          </View>
        </Pressable>
      </Link>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroBox: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(60, 135, 247, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#3c87f7',
  },
  heroText: {
    color: '#3c87f7',
    textAlign: 'center',
  },
  primaryButton: {
    marginBottom: Spacing.three,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    backgroundColor: '#3c87f7',
    shadowColor: '#3c87f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  secondaryButton: {
    marginBottom: Spacing.two,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3c87f7',
    backgroundColor: 'rgba(60, 135, 247, 0.05)',
  },
  buttonContent: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  buttonEmoji: {
    fontSize: 40,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
