import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { getMenuByJoinCode, getMenuItems, getRatingsForMenu, getSubmissionsForMenu } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';
import { ScreenLayout } from './ScreenLayout';

type Item = { id: string; name: string };
type RatingRow = {
  itemId: string;
  rating: number;
  note?: string | null;
  createdAt?: unknown;
  submissionId?: string | null;
  reviewerName?: string | null;
};
type SubmissionRow = {
  id: string;
  note: string | null;
  reviewerName: string | null;
  createdAt: unknown;
};
type RankedItem = { id: string; name: string; avg: number; count: number; notes: string[] };
type SubmissionView = {
  id: string;
  note: string | null;
  reviewerName: string | null;
  createdAt: unknown;
  ratings: { itemId: string; rating: number }[];
};

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function ResultsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [joinCode, setJoinCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [menuTitle, setMenuTitle] = useState<string>('');
  const [items, setItems] = useState<Item[]>([]);
  const [topItems, setTopItems] = useState<RankedItem[]>([]);
  const [lowItems, setLowItems] = useState<RankedItem[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionView[]>([]);

  const verify = async () => {
    setError(null);

    const normalizedCode = joinCode.trim().toUpperCase();
    if (!normalizedCode) {
      setError('Please enter a join code.');
      return;
    }

    try {
      const menu = await getMenuByJoinCode(normalizedCode);
      if ((menu.viewPassword ?? '') !== (password ?? '')) {
        setError('Incorrect password.');
        return;
      }

      setAuthorized(true);
      setMenuTitle(menu.title ?? 'Results');

      const fetchedItems = asArray<Item>(await getMenuItems(menu.id));
      const mappedItems = fetchedItems.map((i) => ({ id: String(i.id), name: String(i.name) }));
      setItems(mappedItems);

      const ratings = asArray<RatingRow>(await getRatingsForMenu(menu.id));
      const stats: Record<string, { sum: number; count: number; notes: string[] }> = {};

      ratings.forEach((r) => {
        const itemId = String(r.itemId ?? '');
        if (!itemId) return;
        const rating = Number(r.rating);
        if (!Number.isFinite(rating)) return;

        if (!stats[itemId]) stats[itemId] = { sum: 0, count: 0, notes: [] };
        stats[itemId].sum += rating;
        stats[itemId].count += 1;

        const note = typeof r.note === 'string' ? r.note.trim() : '';
        if (note) stats[itemId].notes.push(note);
      });

      const ranked = mappedItems.map((it) => {
        const current = stats[it.id];
        const count = current?.count ?? 0;
        const avg = count > 0 ? current.sum / count : 0;
        return {
          id: it.id,
          name: it.name,
          avg,
          count,
          notes: current?.notes ?? [],
        };
      });

      const desc = ranked.slice().sort((a, b) => b.avg - a.avg).slice(0, 3).map((x) => ({ ...x, notes: x.notes.slice(0, 3) }));
      const asc = ranked.slice().sort((a, b) => a.avg - b.avg).slice(0, 3).map((x) => ({ ...x, notes: x.notes.slice(0, 3) }));
      setTopItems(desc);
      setLowItems(asc);

      const submissions = asArray<SubmissionRow>(await getSubmissionsForMenu(menu.id));
      const grouped: Record<string, SubmissionView> = {};

      submissions.forEach((s) => {
        const id = String(s.id ?? '');
        if (!id) return;
        grouped[id] = {
          id,
          note: typeof s.note === 'string' ? s.note : null,
          reviewerName: typeof s.reviewerName === 'string' ? s.reviewerName : null,
          createdAt: s.createdAt ?? null,
          ratings: [],
        };
      });

      ratings.forEach((r) => {
        const sid = String(r.submissionId ?? 'unknown');
        if (!grouped[sid]) {
          grouped[sid] = {
            id: sid,
            note: null,
            reviewerName: typeof r.reviewerName === 'string' ? r.reviewerName : null,
            createdAt: r.createdAt ?? null,
            ratings: [],
          };
        }

        const itemId = String(r.itemId ?? '');
        const rating = Number(r.rating);
        if (!itemId || !Number.isFinite(rating)) return;
        grouped[sid].ratings.push({ itemId, rating });
      });

      setAllSubmissions(Object.values(grouped));
    } catch (verifyError) {
      const message = verifyError instanceof Error ? verifyError.message : 'Unable to verify. Try again.';
      setError(message);
      setAuthorized(false);
    }
  };

  return (
    <ScreenLayout
      title="Results"
      subtitle={authorized ? `Results for ${menuTitle}` : 'Enter join code and password to view results'}
    >
      {!authorized ? (
        <View>
          <Text style={[styles.label, { color: theme.text }]}>Join Code</Text>
          <TextInput
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="e.g., ABC123"
            placeholderTextColor="#999"
            style={[styles.input, { color: theme.text }]}
            autoCapitalize="characters"
          />

          <Text style={[styles.label, { color: theme.text }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Results password"
            placeholderTextColor="#999"
            secureTextEntry
            style={[styles.input, { color: theme.text }]}
          />

          {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

          <Pressable onPress={verify} style={styles.button}>
            <Text style={styles.buttonText}>Show Results</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <Text style={[styles.menuTitle, { color: theme.text }]}>{menuTitle}</Text>

          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Top rated</Text>
            {topItems.length === 0 ? (
              <Text style={[styles.rowText, { color: theme.text }]}>No ratings yet.</Text>
            ) : (
              topItems.map((it) => (
                <View key={it.id} style={styles.entryRow}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{it.name}</Text>
                  <Text style={[styles.rowText, { color: theme.text }]}>
                    Avg: {it.avg.toFixed(2)}/5 - {it.count} review{it.count === 1 ? '' : 's'}
                  </Text>
                  {it.notes[0] ? (
                    <Text style={[styles.rowText, { color: theme.text }]}>"{it.notes[0].slice(0, 120)}"</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Lowest rated</Text>
            {lowItems.length === 0 ? (
              <Text style={[styles.rowText, { color: theme.text }]}>No ratings yet.</Text>
            ) : (
              lowItems.map((it) => (
                <View key={it.id} style={styles.entryRow}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{it.name}</Text>
                  <Text style={[styles.rowText, { color: theme.text }]}>
                    Avg: {it.avg.toFixed(2)}/5 - {it.count} review{it.count === 1 ? '' : 's'}
                  </Text>
                  {it.notes[0] ? (
                    <Text style={[styles.rowText, { color: theme.text }]}>"{it.notes[0].slice(0, 120)}"</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>All submissions</Text>
            {allSubmissions.length === 0 ? (
              <Text style={[styles.rowText, { color: theme.text }]}>No submissions yet.</Text>
            ) : (
              allSubmissions.map((s) => (
                <View key={s.id} style={styles.entryRow}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{s.reviewerName ?? 'Anonymous'}</Text>
                  {s.note ? <Text style={[styles.rowText, { color: theme.text }]}>Note: "{s.note}"</Text> : null}
                  {asArray(s.ratings).map((r) => {
                    const item = items.find((it) => it.id === r.itemId);
                    return (
                      <Text key={`${s.id}-${r.itemId}`} style={[styles.rowText, { color: theme.text }]}>
                        {item?.name ?? r.itemId}: {r.rating}/5
                      </Text>
                    );
                  })}
                </View>
              ))
            )}
          </View>

          <Pressable onPress={() => router.replace('/')} style={styles.finishedButton}>
            <Text style={styles.finishedText}>Finished</Text>
          </Pressable>
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.one,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  button: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3c87f7',
    backgroundColor: '#3c87f7',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    color: '#D32F2F',
    marginBottom: Spacing.two,
    fontWeight: '600',
  },
  resultsContainer: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  entryRow: {
    marginTop: Spacing.one,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowText: {
    fontSize: 13,
  },
  finishedButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
