import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Clipboard, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ScreenLayout } from '@/screens/ScreenLayout';

export default function MenuCreatedRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const code = typeof params.code === 'string' ? params.code : '';

  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!code) return;
    Clipboard.setString(code);
    setCopied(true);
    Alert.alert('Copied!', `Code "${code}" copied to clipboard`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ScreenLayout title="🎉 Menu Created" subtitle="Your menu is live and ready to share!">
      <View style={styles.celebrationBox}>
        <ThemedText type="title" style={styles.emoji}>✨</ThemedText>
        <ThemedText type="subtitle" style={styles.successText}>Success!</ThemedText>
      </View>

      <View style={styles.instructionBox}>
        <ThemedText type="smallBold" style={styles.instructionTitle}>📋 Share this code</ThemedText>
        <ThemedText type="small" style={styles.instructionText}>
          Give friends this code to join your menu session
        </ThemedText>
      </View>

      <Pressable
        onPress={copyToClipboard}
        style={({ pressed }) => [styles.codeCard, pressed && styles.cardPressed]}
      >
        <ThemedText type="title" style={styles.codeText}>{code}</ThemedText>
        <ThemedText type="small" style={styles.copyHint}>Tap to copy</ThemedText>
        {copied && <ThemedText type="smallBold" style={styles.copiedText}>Code Copied</ThemedText>}
      </Pressable>

      <View style={styles.tipBox}>
        <ThemedText type="small" style={styles.tipText}>
          💡 Tip: Share via text, email, or social media. Friends can join anytime before you close the menu.
        </ThemedText>
      </View>

      <View style={[styles.instructionBox, { marginTop: Spacing.three }]}> 
        <ThemedText type="smallBold">🔒 Results are password protected</ThemedText>
        <ThemedText type="small">Share the results password only with people who should be able to view ratings.</ThemedText>
      </View>

      <Pressable
        onPress={() => router.replace('/')}
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
      >
        <ThemedText type="smallBold" style={styles.backButtonText}>← Back to Menu</ThemedText>
      </Pressable>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  celebrationBox: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    marginBottom: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.two,
  },
  successText: {
    color: '#22c55e',
    fontSize: 24,
  },
  instructionBox: {
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  instructionTitle: {
    color: '#3c87f7',
    marginBottom: Spacing.one,
  },
  instructionText: {
    color: '#666',
    lineHeight: 20,
  },
  codeCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.four,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.85,
  },
  codeText: {
    color: '#fff',
    letterSpacing: 4,
    fontSize: 32,
    fontWeight: '700',
  },
  copyHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  copiedText: {
    marginTop: Spacing.one,
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13,
    fontWeight: '600',
  },
  tipBox: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(60, 135, 247, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#3c87f7',
  },
  tipText: {
    color: '#3c87f7',
    lineHeight: 18,
  },
  backButton: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 2,
    borderColor: '#3c87f7',
    backgroundColor: 'rgba(60, 135, 247, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#3c87f7',
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
