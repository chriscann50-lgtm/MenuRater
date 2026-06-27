import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function ScreenLayout({ title, subtitle, children }: ScreenLayoutProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: Spacing.four }]}> 
        <View
          style={[
            styles.content,
            { backgroundColor: theme.backgroundElement },
            Platform.OS === 'web' ? { maxWidth: MaxContentWidth } : { maxWidth: undefined },
          ]}>
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
          <View style={styles.actions}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
});
