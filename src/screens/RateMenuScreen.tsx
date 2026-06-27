import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getCommentsForMenu, getMenuItems, saveRatings } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';
import { ScreenLayout } from './ScreenLayout';

export default function RateMenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const menuId = typeof params.menuId === 'string' ? params.menuId : '';
  const itemsJson = typeof params.itemsJson === 'string' ? params.itemsJson : '';
  const menuTitle = typeof params.menuTitle === 'string' ? params.menuTitle : '';
  const reviewerName = typeof params.reviewerName === 'string' ? params.reviewerName : '';
  const displayName = typeof params.displayName === 'string' ? params.displayName : '';

  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [savedRatings, setSavedRatings] = useState<Record<string, number>>({});
  const [draftRatings, setDraftRatings] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [commentsMap, setCommentsMap] = useState<Record<string, string[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // load items from params or from Firestore
      if (itemsJson) {
        try {
          const parsed = JSON.parse(itemsJson) as { id: string; name: string }[];
          setItems(parsed);
          const initial = parsed.reduce((acc, it) => ({ ...acc, [it.id]: 3 }), {} as Record<string, number>);
          setSavedRatings(initial);
          setDraftRatings(initial);
        } catch (e) {
          console.error('Failed to parse itemsJson', e);
        }
      } else if (menuId) {
        try {
          const fetched = await getMenuItems(menuId);
          setItems(fetched.map((it: any) => ({ id: it.id, name: it.name })));
          const initial = fetched.reduce((acc: any, it: any) => ({ ...acc, [it.id]: 3 }), {} as Record<string, number>);
          setSavedRatings(initial);
          setDraftRatings(initial);
          try {
            const comments = await getCommentsForMenu(menuId);
            const map: Record<string, string[]> = {};
            comments.forEach((c) => {
              map[c.itemId] = map[c.itemId] || [];
              map[c.itemId].push(c.text);
            });
            setCommentsMap(map);
          } catch (err) {
            console.error('Failed to load comments for ratings', err);
          }
        } catch (e) {
          console.error(e);
          setError('Unable to load menu items.');
        }
      }
    };

    init();
  }, [itemsJson, menuId]);

  const changeRating = (itemId: string, value: number) => {
    setDraftRatings((prev) => ({ ...prev, [itemId]: value }));
  };

  const saveItemRating = (itemId: string) => {
    setSavedRatings((prev) => ({ ...prev, [itemId]: draftRatings[itemId] ?? prev[itemId] ?? 3 }));
  };

  const submitRatings = async () => {
    setError(null);
    if (!menuId) {
      setError('Missing menu id.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = items.map((it) => ({ itemId: it.id, rating: savedRatings[it.id] ?? 3 }));
      // collect per-item comments from local state
      const commentsPayload: { itemId: string; text: string }[] = [];
      Object.keys(commentsMap).forEach((itemId) => {
        (commentsMap[itemId] || []).forEach((text) => {
          commentsPayload.push({ itemId, text });
        });
      });

      await saveRatings(menuId, payload, note.trim() || null, reviewerName, commentsPayload);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setError('Failed to submit ratings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout title={`Rate: ${menuTitle || 'Menu'}`} subtitle="Adjust ratings then submit">
      {error && (
        <View style={styles.errorBox}>
          <ThemedText type="smallBold" style={styles.error}>⚠️ {error}</ThemedText>
        </View>
      )}


      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryCard}>
          <ThemedText type="smallBold" style={styles.summaryText}>
            {items.length > 0 ? `Rating ${items.length} item${items.length === 1 ? '' : 's'}` : 'Loading menu items...'}
          </ThemedText>
          <ThemedText type="small" style={styles.summarySubtext}>
            Use the controls below to rate each item from 1 to 5 and leave an optional 250-character note.
          </ThemedText>
        </View>

        {items.map((item) => {
          const savedValue = savedRatings[item.id] ?? 5;
          const draftValue = draftRatings[item.id] ?? savedValue;
          const hasUnsavedChange = draftValue !== savedValue;

          return (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.backgroundElement }]}> 
              <ThemedText type="smallBold" style={styles.itemName}>{item.name}</ThemedText>
              <View style={styles.rowWithButton}>
                <View style={styles.starRow}>
                          {Array.from({ length: 5 }, (_, index) => {
                            const value = index + 1;
                    const isActive = draftValue >= value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() => changeRating(item.id, value)}
                        style={({ pressed }) => [styles.starButton, pressed && styles.buttonPressed]}
                      >
                        <ThemedText type="smallBold" style={[styles.starText, isActive && styles.starActive]}>
                          {isActive ? '★' : '☆'}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  onPress={() => saveItemRating(item.id)}
                  disabled={!hasUnsavedChange}
                  style={({ pressed }) => [
                    styles.saveButton,
                    !hasUnsavedChange && styles.saveButtonDisabled,
                    pressed && hasUnsavedChange && styles.buttonPressed,
                  ]}
                >
                  <ThemedText type="smallBold" style={[styles.saveButtonText, !hasUnsavedChange && styles.saveButtonTextDisabled]}>
                    {hasUnsavedChange ? 'Save' : 'Saved'}
                  </ThemedText>
                </Pressable>
              </View>
              <ThemedText type="small" style={[styles.ratingHint, hasUnsavedChange && styles.unsavedHint]}>
                {hasUnsavedChange ? `Draft: ${draftValue}/5 — tap save to confirm` : `Saved: ${savedValue}/5`}
              </ThemedText>
                  <ThemedText type="smallBold" style={{ marginTop: Spacing.one }}>Comments</ThemedText>
                  {(commentsMap[item.id] ?? []).map((c, idx) => (
                    <ThemedText key={idx} type="small">- {c}</ThemedText>
                  ))}
                  <TextInput
                    value={commentInputs[item.id] ?? ''}
                    onChangeText={(t) => setCommentInputs((s) => ({ ...s, [item.id]: t.slice(0, 250) }))}
                    placeholder="Add a comment..."
                    placeholderTextColor="#999"
                    style={[styles.noteInput, { marginTop: Spacing.one, color: theme.text }]}
                    multiline
                    maxLength={250}
                  />
                  <Pressable
                    onPress={async () => {
                      const txt = (commentInputs[item.id] ?? '').trim();
                      if (!txt) return;
                      // store locally until submission so comments are saved with the submissionId
                      setCommentsMap((m) => ({ ...m, [item.id]: [...(m[item.id] ?? []), txt] }));
                      setCommentInputs((s) => ({ ...s, [item.id]: '' }));
                    }}
                    style={[styles.saveButton, { marginTop: Spacing.one }]}
                  >
                    <ThemedText type="smallBold" style={styles.saveButtonText}>Add Comment</ThemedText>
                  </Pressable>
            </View>
          );
        })}

        {!submitted ? (
          <>
            <ThemedText type="smallBold">Optional note (max 250 chars)</ThemedText>
            <TextInput
              value={note}
              onChangeText={(t) => setNote(t.slice(0, 250))}
              placeholder="What did you think? (optional)"
              placeholderTextColor="#999"
              style={[styles.noteInput, { color: theme.text }]}
              multiline
              maxLength={250}
            />

            <Pressable onPress={submitRatings} disabled={isSubmitting} style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed]}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText type="smallBold" style={styles.submitText}>Submit Ratings</ThemedText>
              )}
            </Pressable>

            <Pressable onPress={() => router.replace('/')} style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
              <ThemedText type="smallBold" style={styles.backButtonText}>← Back to Menu</ThemedText>
            </Pressable>
          </>
        ) : (
          <View style={{ gap: Spacing.three }}>
            <ThemedText type="title">Thanks — ratings submitted</ThemedText>
            <ThemedText type="small">You can view the results or finish and return home.</ThemedText>
            <Pressable onPress={() => router.replace('/results')} style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed]}>
              <ThemedText type="smallBold" style={styles.submitText}>View Results</ThemedText>
            </Pressable>
            <Pressable onPress={() => router.replace('/')} style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
              <ThemedText type="smallBold" style={styles.backButtonText}>Finished</ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  summaryCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    backgroundColor: 'rgba(14, 59, 111, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(14, 59, 111, 0.15)',
  },
  summaryText: {
    marginBottom: Spacing.one,
    color: '#0f4db6',
  },
  summarySubtext: {
    color: '#556a8f',
  },
  itemCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(60, 98, 151, 0.16)',
    shadowColor: '#0f4db6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  itemName: {
    fontSize: 16,
    marginBottom: Spacing.two,
    color: '#1f3254',
  },
  starRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  starButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: Spacing.two,
  },
  starText: {
    fontSize: 18,
    color: '#8b94a6',
  },
  starActive: {
    color: '#f5b301',
  },
  rowWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  saveButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3c87f7',
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    borderColor: '#8b94a6',
    backgroundColor: 'rgba(139, 148, 166, 0.12)',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  saveButtonTextDisabled: {
    color: '#8b94a6',
  },
  ratingHint: {
    marginTop: Spacing.two,
    color: '#556a8f',
  },
  unsavedHint: {
    color: '#1f4db6',
  },
  submitButton: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3c87f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
  },
  backButton: {
    marginTop: Spacing.three,
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
  infoBox: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(60, 135, 247, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#3c87f7',
  },
});
