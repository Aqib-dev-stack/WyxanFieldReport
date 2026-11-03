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
   * Pads the content (default). Turn off for full-width content such as
   * lists and banners, which pad themselves.
   */
  padded?: boolean;
  /**
   * Safe-area edges this screen pads itself. The navigator's header covers the
   * top and the tab bar covers the bottom, so by default only the sides.
   */
  edges?: Edge[];
  /**
   * Shift the content up when the keyboard opens (default). Turn off for a
   * screen with a fixed footer: Android's own adjustResize already handles
   * the keyboard, and doing both makes the footer jump.
   */
  avoidKeyboard?: boolean;
};

const DEFAULT_EDGES: Edge[] = ['left', 'right'];

/**
 * Root of every screen: background, safe-area sides, and a keyboard-avoiding
 * layout so inputs stay visible above the keyboard on both platforms.
 */
const Screen = ({
  children,
  scroll = false,
  padded = true,
  edges = DEFAULT_EDGES,
  avoidKeyboard = true,
}: ScreenProps) => (
  <SafeAreaView style={styles.root} edges={edges}>
    <KeyboardAvoidingView
      style={styles.root}
      enabled={avoidKeyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            padded && styles.padding,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, padded && styles.padding]}>
          {children}
        </View>
      )}
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  padding: { padding: SPACING.lg },
});

export default Screen;
