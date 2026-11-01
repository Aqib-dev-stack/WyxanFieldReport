import { Wifi, WifiOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@config';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

/**
 * Live connectivity in the header.
 * - Online: green Wifi icon only. Being online needs no words.
 * - Offline: dark WifiOff icon plus the word "Offline", so the state is never
 *   carried by colour alone.
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
        <>
          <WifiOff size={SIZES.iconMd} color={COLORS.networkOffline} />
          <Text style={styles.label}>Offline</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: SIZES.hitTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  label: { ...TYPOGRAPHY.label, color: COLORS.networkOffline },
});

export default NetworkIndicator;
