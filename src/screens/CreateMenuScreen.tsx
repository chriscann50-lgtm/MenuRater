import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { createMenuWithItems } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';
import { ScreenLayout } from './ScreenLayout';

const generateJoinCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
};

export default function CreateMenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [itemText, setItemText] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const itemInputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    const trimmed = itemText.trim();
    if (!trimmed) return;
    setItems((current) => [...current, trimmed]);
    setItemText('');
    requestAnimationFrame(() => itemInputRef.current?.focus());
  };

  const startEditingItem = (index: number) => {
    if (isSaving) return;
    setEditingIndex(index);
    setEditingText(items[index] ?? '');
    requestAnimationFrame(() => editInputRef.current?.focus());
  };

  const cancelEditingItem = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const saveEditedItem = () => {
    if (editingIndex === null) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      setError('Item name cannot be empty.');
      return;
    }
    setItems((current) => current.map((item, idx) => (idx === editingIndex ? trimmed : item)));
    setEditingIndex(null);
    setEditingText('');
  };

  const saveMenu = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Please enter a menu title.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one menu item.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a view password for results.');
      return;
    }

    setIsSaving(true);
    const code = generateJoinCode();

    try {
      const result = await createMenuWithItems(title.trim(), code, items, password.trim());
      setTitle('');
      setItems([]);
      setItemText('');
      setEditingIndex(null);
      setEditingText('');
      setPassword('');
      router.push(`/menu-created?code=${result.joinCode}`);
      return;
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save menu. Please try again.';
      setError(message);
      console.error(saveError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenLayout
      title="Create Menu"
      subtitle="Start a new menu session and share it with friends."
    >
      <ThemedText type="smallBold" style={[styles.label, { color: '#3c87f7' }]}>📝 Menu Title</ThemedText>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Give your menu a name..."
        placeholderTextColor="#999"
        style={[styles.input, { borderColor: '#3c87f7', color: theme.text }]}
        editable={!isSaving}
      />

      <ThemedText type="smallBold" style={[styles.label, { color: '#f59e0b' }]}>🔒 Results Password</ThemedText>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Set a password to view results"
        placeholderTextColor="#999"
        secureTextEntry
        style={[styles.input, { borderColor: '#f59e0b', color: theme.text }]}
        editable={!isSaving}
      />

      <ThemedText type="smallBold" style={[styles.label, { color: '#22c55e' }]}>🍽️ Add Items</ThemedText>
      <View style={styles.row}>
        <TextInput
          ref={itemInputRef}
          value={itemText}
          onChangeText={setItemText}
          placeholder="e.g., Pasta, Pizza, Salad..."
          placeholderTextColor="#999"
          style={[styles.input, styles.flexGrow, { borderColor: '#22c55e', color: theme.text }]}
          editable={!isSaving}
          onSubmitEditing={addItem}
          blurOnSubmit={false}
          returnKeyType="done"
        />
        <Pressable
          onPress={addItem}
          disabled={isSaving}
          style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
        >
          <ThemedText type="smallBold" style={styles.addButtonText}>+</ThemedText>
        </Pressable>
      </View>

      {items.length > 0 && (
        <View style={[styles.itemList, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
          <ThemedText type="smallBold" style={[styles.itemsTitle, { color: '#22c55e' }]}>
            ✓ Items added: {items.length}
          </ThemedText>
          <ThemedText type="small" style={styles.editHintText}>Tap or long-press an item to edit it.</ThemedText>
          <View style={styles.itemsGrid}>
            {items.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.itemTag}>
                {editingIndex === index ? (
                  <>
                    <TextInput
                      ref={editInputRef}
                      value={editingText}
                      onChangeText={setEditingText}
                      style={[styles.editInput, { color: theme.text }]}
                      placeholder="Edit item"
                      placeholderTextColor="#999"
                      onSubmitEditing={saveEditedItem}
                      blurOnSubmit={false}
                      editable={!isSaving}
                    />
                    <View style={styles.editActionsRow}>
                      <Pressable
                        onPress={saveEditedItem}
                        disabled={isSaving}
                        style={({ pressed }) => [styles.itemActionButton, styles.itemSaveButton, pressed && styles.buttonPressed]}
                      >
                        <ThemedText type="smallBold" style={styles.itemActionText}>Save</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={cancelEditingItem}
                        disabled={isSaving}
                        style={({ pressed }) => [styles.itemActionButton, styles.itemCancelButton, pressed && styles.buttonPressed]}
                      >
                        <ThemedText type="smallBold" style={styles.itemActionText}>Cancel</ThemedText>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <Pressable onPress={() => startEditingItem(index)} onLongPress={() => startEditingItem(index)} disabled={isSaving}>
                    <ThemedText type="small" style={styles.itemTagText}>
                      ✏ {item}
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <ThemedText type="smallBold" style={styles.error}>⚠️ {error}</ThemedText>
        </View>
      )}

      <Pressable
        onPress={saveMenu}
        disabled={isSaving}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        {isSaving ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#fff" />
            <ThemedText type="smallBold" style={styles.buttonText}>
              Creating…
            </ThemedText>
          </View>
        ) : (
          <View style={styles.buttonInner}>
            <ThemedText type="title" style={styles.buttonEmoji}>✨</ThemedText>
            <ThemedText type="smallBold" style={styles.buttonText}>Create Menu</ThemedText>
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
    marginBottom: Spacing.three,
    fontSize: 16,
    backgroundColor: 'rgba(60, 135, 247, 0.05)',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  flexGrow: {
    flex: 1,
  },
  addButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
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
  itemList: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  itemsTitle: {
    marginBottom: Spacing.one,
    fontSize: 14,
  },
  editHintText: {
    marginBottom: Spacing.two,
    color: '#166534',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  itemTag: {
    backgroundColor: '#22c55e',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
    marginBottom: Spacing.one,
  },
  editInput: {
    minWidth: 160,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.one,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  itemActionButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  itemSaveButton: {
    backgroundColor: '#15803d',
  },
  itemCancelButton: {
    backgroundColor: '#475569',
  },
  itemActionText: {
    color: '#fff',
    fontSize: 12,
  },
  itemTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
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
