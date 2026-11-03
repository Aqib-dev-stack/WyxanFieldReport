import { Wifi, WifiOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

/**
 * Live connectivity in the (dark) header.
 * - Online: green Wifi icon only. Being online needs no words.
 * - Offline: dark WifiOff icon plus the word "Offline" on a light pill, so
 *   it is readable on the dark header and never carried by colour alone.
 * - Unknown (first few ms after launch): renders nothing rather than guess.
 */
const NetworkIndicator = () => {
  const status = useNetworkStatus();

  if (status === 'unknown') {
    return null;
  }

  const isOnline = status === 'online';

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={isOnline ? 'Online' : 'Offline'}
      // Announce changes (e.g. signal lost) without the user moving focus.
      accessibilityLiveRegion="polite"
    >
      {isOnline ? (
        <Wifi size={SIZES.iconMd} color={COLORS.networkOnline} />
      ) : (
        <View style={styles.offlinePill}>
          <WifiOff size={SIZES.iconSm} color={COLORS.networkOffline} />
          <Text style={styles.label}>Offline</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: SIZES.hitTarget,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + SPACING.xxs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.networkOfflinePill,
  },
  label: { ...TYPOGRAPHY.label, color: COLORS.networkOffline },
});

export default NetworkIndicator;
