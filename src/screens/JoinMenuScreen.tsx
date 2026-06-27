import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getMenuByJoinCode, getMenuItems } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';
import { ScreenLayout } from './ScreenLayout';

export default function JoinMenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinMenu = async () => {
    setError(null);

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please enter a join code.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (trimmedCode.length !== 6) {
      setError('Join code must be 6 characters.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name before joining.');
      return;
    }

    setIsJoining(true);

    try {
      const menu = await getMenuByJoinCode(trimmedCode);
      const items = await getMenuItems(menu.id);

      setCode('');
      router.push({
        pathname: '/rate-menu',
        params: {
          menuId: menu.id,
          menuTitle: menu.title,
          itemsJson: JSON.stringify(items),
          reviewerName: name.trim(),
          displayName: name.trim(),
        },
      });
      return;
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : 'Unable to join menu. Please try again.';
      setError(message);
      console.error(joinError);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <ScreenLayout
      title="🔗 Join Menu"
      subtitle="Enter a menu code to join a rating session"
    >
      <View style={styles.infoBox}>
        <ThemedText type="small" style={styles.infoText}>
          Ask the menu creator for the 6-character join code to get started.
        </ThemedText>
      </View>

      <ThemedText type="smallBold" style={[styles.label, { color: '#3c87f7' }]}>
        📝 Join Code
      </ThemedText>
      <ThemedText type="smallBold" style={[styles.label, { color: '#3c87f7' }]}>
        🙋 Your Name
      </ThemedText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your display name"
        placeholderTextColor="#999"
        style={[styles.input, { borderColor: '#3c87f7', color: theme.text, textAlign: 'left', letterSpacing: 0 }]}
        editable={!isJoining}
      />
      <TextInput
        value={code}
        onChangeText={(text) => setCode(text.toUpperCase())}
        placeholder="e.g., ABC123"
        placeholderTextColor="#999"
        maxLength={6}
        style={[styles.input, { borderColor: '#3c87f7', color: theme.text }]}
        editable={!isJoining}
        onSubmitEditing={joinMenu}
        returnKeyType="done"
      />

      <ThemedText type="small" style={styles.codeHint}>
        {code.length}/6 characters
      </ThemedText>

      {error && (
        <View style={styles.errorBox}>
          <ThemedText type="smallBold" style={styles.error}>⚠️ {error}</ThemedText>
        </View>
      )}

      <Pressable
        onPress={joinMenu}
        disabled={isJoining}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        {isJoining ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#fff" />
            <ThemedText type="smallBold" style={styles.buttonText}>
              Joining…
            </ThemedText>
          </View>
        ) : (
          <View style={styles.buttonInner}>
            <ThemedText type="title" style={styles.buttonEmoji}>✨</ThemedText>
            <ThemedText type="smallBold" style={styles.buttonText}>Join Menu</ThemedText>
          </View>
        )}
      </Pressable>
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
  infoBox: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(60, 135, 247, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#3c87f7',
  },
  infoText: {
    color: '#3c87f7',
    lineHeight: 20,
  },
  label: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 2,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    backgroundColor: 'rgba(60, 135, 247, 0.05)',
    textAlign: 'center',
  },
  codeHint: {
    textAlign: 'center',
    color: '#999',
    marginBottom: Spacing.four,
  },
  button: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
    shadowColor: '#3c87f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  buttonEmoji: {
    fontSize: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  error: {
    color: '#D32F2F',
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
});
