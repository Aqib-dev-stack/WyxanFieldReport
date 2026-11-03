import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
} from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@config';

import BrandMark from '../BrandMark';
import Wordmark from '../Wordmark';

export type BrandSplashProps = {
  /** The app is ready to show (database open). */
  ready: boolean;
  /** Called once the splash has faded away. */
  onHidden: () => void;
};

/** Same size and position as the native splash icon, so the hand-over is seamless. */
const MARK_SIZE = 96;
/** Shown at least this long, so the animation is never cut off mid-way. */
const MIN_VISIBLE_MS = 1300;

/**
 * Animated splash on top of the app while it starts. It begins exactly
 * where the native splash ends (ink background, mark centred at 96dp), then
 * the mark turns a quarter (a square turned 90° looks the same, so it lands
 * where it started) while the wordmark and the product name rise in. When
 * the app is ready, everything fades out, revealing the first screen.
 * Native-driver animations only, so the JS thread stays free for startup.
 * With "reduce motion" on: no spin, just the fade.
 */
const BrandSplash = ({ ready, onHidden }: BrandSplashProps) => {
  const turn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduceMotion => {
        if (cancelled) {
          return;
        }
        const intro = reduceMotion
          ? Animated.timing(reveal, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          : Animated.parallel([
              Animated.timing(turn, {
                toValue: 1,
                duration: 900,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(pulse, {
                  toValue: 0.86,
                  duration: 300,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.spring(pulse, {
                  toValue: 1,
                  friction: 4,
                  useNativeDriver: true,
                }),
              ]),
              Animated.timing(reveal, {
                toValue: 1,
                duration: 500,
                delay: 350,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]);
        intro.start(() => {
          const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt));
          setTimeout(() => !cancelled && setIntroDone(true), wait);
        });
      })
      .catch(() => setIntroDone(true));
    return () => {
      cancelled = true;
    };
  }, [pulse, reveal, turn]);

  useEffect(() => {
    if (!ready || !introDone) {
      return;
    }
    Animated.timing(fade, {
      toValue: 0,
      duration: 320,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onHidden());
  }, [fade, introDone, onHidden, ready]);

  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  const rise = reveal.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View
      style={[styles.root, { opacity: fade }]}
      accessible
      accessibilityLabel="WYXAN Field Report is starting"
    >
      <Animated.View style={{ transform: [{ rotate }, { scale: pulse }] }}>
        <BrandMark size={MARK_SIZE} xColor={COLORS.header} />
      </Animated.View>
      {/* Absolutely positioned under the centred mark, so the mark keeps the
          exact spot of the native splash icon. */}
      <Animated.View
        style={[
          styles.below,
          { opacity: reveal, transform: [{ translateY: rise }] },
        ]}
      >
        <Wordmark height={26} />
        <Text style={styles.product}>FIELD REPORT</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.header,
  },
  below: {
    position: 'absolute',
    top: '50%',
    marginTop: MARK_SIZE / 2 + SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  product: {
    ...TYPOGRAPHY.label,
    color: COLORS.onHeaderMuted,
    letterSpacing: 4,
  },
});

export default BrandSplash;
