import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@config';

import Wordmark from '../../brand/Wordmark';
import IconButton from '../../common/IconButton';
import { useToastAnchor } from '../../common/Toast';
import NetworkIndicator from '../NetworkIndicator';

import type { LayoutChangeEvent } from 'react-native';

export type AppHeaderProps = {
  title: string;
  /** One line under the title (main tabs only). */
  subtitle?: string;
  /** Shows a back arrow when set (stack screens). */
  onBack?: () => void;
  /** Shows a settings button when set (main tabs only). */
  onOpenSettings?: () => void;
};

/**
 * One dark, branded header for every screen (like wyxan.com), so the network
 * indicator sits in the same place everywhere.
 *
 * - Main tabs: WYXAN wordmark, network, settings; then a large title and
 *   one line saying what the list is.
 * - Stack screens: back arrow, title, network.
 *
 * The app draws edge to edge, so the header pads itself below the status bar.
 */
const AppHeader = ({
  title,
  subtitle,
  onBack,
  onOpenSettings,
}: AppHeaderProps) => {
  const insets = useSafeAreaInsets();
  // Tell the toast where this header ends, while this screen is showing.
  const [height, setHeight] = useState(0);
  const isFocused = useIsFocused();
  const setToastAnchor = useToastAnchor();
  useEffect(() => {
    if (isFocused && height > 0) {
      setToastAnchor(height);
    }
  }, [height, isFocused, setToastAnchor]);
  const onLayout = (event: LayoutChangeEvent) =>
    setHeight(event.nativeEvent.layout.height);

  const sides = {
    paddingLeft: insets.left + (onBack ? SPACING.xs : SPACING.lg),
    paddingRight: insets.right + SPACING.xs,
  };

  if (onBack) {
    return (
      <View
        style={[styles.container, { paddingTop: insets.top }]}
        onLayout={onLayout}
      >
        <View style={[styles.row, sides]}>
          <IconButton
            icon={<ArrowLeft size={SIZES.iconMd} color={COLORS.onHeader} />}
            accessibilityLabel="Go back"
            onPress={onBack}
            rippleColor={COLORS.headerPressed}
          />
          <Text
            style={styles.stackTitle}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          <NetworkIndicator />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      onLayout={onLayout}
    >
      <View style={[styles.row, sides]}>
        <View style={styles.brand}>
          <Wordmark height={20} />
        </View>
        <NetworkIndicator />
        {onOpenSettings ? (
          <IconButton
            icon={<Settings size={SIZES.iconMd} color={COLORS.onHeader} />}
            accessibilityLabel="Settings"
            onPress={onOpenSettings}
            rippleColor={COLORS.headerPressed}
          />
        ) : null}
      </View>
      <View
        style={[
          styles.titleBlock,
          {
            paddingLeft: insets.left + SPACING.lg,
            paddingRight: insets.right + SPACING.lg,
          },
        ]}
      >
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.header },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: SIZES.headerHeight,
  },
  brand: { flex: 1, justifyContent: 'center' },
  stackTitle: {
    ...TYPOGRAPHY.headline,
    flex: 1,
    color: COLORS.onHeader,
  },
  titleBlock: { paddingBottom: SPACING.lg, gap: SPACING.xxs },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: COLORS.onHeader,
    letterSpacing: -0.3,
  },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.onHeaderMuted },
});

export default AppHeader;
