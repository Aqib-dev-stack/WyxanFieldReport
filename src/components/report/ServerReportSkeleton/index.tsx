import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@config';

export type ServerReportSkeletonProps = {
  rows?: number;
};

/**
 * Placeholder rows shaped like the real cards, so the layout doesn't jump
 * when data arrives. A slow pulse (native driver) signals "working".
 */
const ServerReportSkeleton = ({ rows = 4 }: ServerReportSkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View
      style={styles.list}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading reports from the server"
      accessibilityState={{ busy: true }}
    >
      {Array.from({ length: rows }, (_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity }]}>
          <View style={styles.thumb} />
          <View style={styles.body}>
            <View style={[styles.line, styles.lineLong]} />
            <View style={[styles.line, styles.lineMedium]} />
            <View style={[styles.line, styles.lineShort]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { gap: SPACING.md },
  card: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  body: { flex: 1, gap: SPACING.sm, justifyContent: 'center' },
  line: {
    height: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
  },
  lineLong: { width: '90%' },
  lineMedium: { width: '60%' },
  lineShort: { width: '35%' },
});

export default ServerReportSkeleton;
