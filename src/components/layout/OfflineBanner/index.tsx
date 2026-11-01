import { CloudOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@config';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

/**
 * Shown only while offline. Calm, not red: offline is normal on site, and the
 * message is that nothing is lost and nothing needs doing.
 */
const OfflineBanner = () => {
  const status = useNetworkStatus();

  if (status !== 'offline') {
    return null;
  }

  return (
    <View
      style={styles.banner}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <CloudOff size={SIZES.iconMd} color={COLORS.onPrimary} />
      <Text style={styles.text}>
        You're offline. Reports are safe on this phone and will upload
        automatically.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.networkOffline,
  },
  text: { ...TYPOGRAPHY.body, flex: 1, color: COLORS.onPrimary },
});

export default OfflineBanner;
