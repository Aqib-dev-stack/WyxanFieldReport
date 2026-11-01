import { ArrowLeft, Settings } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@config';

import IconButton from '../../common/IconButton';
import NetworkIndicator from '../NetworkIndicator';

export type AppHeaderProps = {
  title: string;
  /** Shows a back arrow when set. */
  onBack?: () => void;
  /** Shows a settings button when set (main tabs only). */
  onOpenSettings?: () => void;
};

/**
 * One header for every screen, used by both the tab and the stack navigator,
 * so the network indicator sits in the same place everywhere. The app draws
 * edge to edge, so the header pads itself below the status bar.
 */
const AppHeader = ({ title, onBack, onOpenSettings }: AppHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left + (onBack ? SPACING.xs : SPACING.lg),
          paddingRight: insets.right + SPACING.xs,
        },
      ]}
    >
      {onBack ? (
        <IconButton
          icon={<ArrowLeft size={SIZES.iconMd} color={COLORS.textPrimary} />}
          accessibilityLabel="Go back"
          onPress={onBack}
        />
      ) : null}

      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>

      <NetworkIndicator />

      {onOpenSettings ? (
        <IconButton
          icon={<Settings size={SIZES.iconMd} color={COLORS.textPrimary} />}
          accessibilityLabel="Settings"
          onPress={onOpenSettings}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: SIZES.headerHeight,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.headline,
    flex: 1,
    color: COLORS.textPrimary,
  },
});

export default AppHeader;
