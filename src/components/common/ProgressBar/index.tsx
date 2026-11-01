import { StyleSheet, View } from 'react-native';

import { COLORS, RADIUS } from '@config';

export type ProgressBarProps = {
  /** 0–1; clamped. */
  progress: number;
  color?: string;
  /** Read by screen readers, e.g. "Upload progress". */
  accessibilityLabel: string;
};

/** Thin determinate bar. Width is a percentage, so no layout measuring. */
const ProgressBar = ({
  progress,
  color = COLORS.primary,
  accessibilityLabel,
}: ProgressBarProps) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const percent = Math.round(clamped * 100);

  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View
        style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: RADIUS.pill },
});

export default ProgressBar;
