import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SPACING } from '@config';

import type { ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: ReactNode;
  /** Scrolls the content; use for forms and anything taller than a small phone. */
  scroll?: boolean;
  /**
   * Safe-area edges this screen pads itself. The navigator's header covers the
   * top and the tab bar covers the bottom, so by default only the sides.
   */
  edges?: Edge[];
};

const DEFAULT_EDGES: Edge[] = ['left', 'right'];

/**
 * Root of every screen: background, safe-area sides, and a keyboard-avoiding
 * layout so inputs stay visible above the keyboard on both platforms.
 */
const Screen = ({
  children,
  scroll = false,
  edges = DEFAULT_EDGES,
}: ScreenProps) => (
  <SafeAreaView style={styles.root} edges={edges}>
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SPACING.lg },
  scrollContent: { flexGrow: 1, padding: SPACING.lg },
});

export default Screen;
