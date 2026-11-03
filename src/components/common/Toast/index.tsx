import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';

import type { ReactNode } from 'react';

type ToastMessage = { id: number; message: string; icon?: ReactNode };

type ShowToast = (message: string, icon?: ReactNode) => void;

const ToastContext = createContext<ShowToast>(() => undefined);
/** Lets the visible header report where it ends (its height from the top). */
const ToastAnchorContext = createContext<(headerBottom: number) => void>(
  () => undefined,
);

const VISIBLE_MS = 4000;
const FADE_MS = 180;

/**
 * Minimal app-wide toast: one message at a time, shown just below the
 * header that is on screen (headers report their real height, which differs
 * between the tall tab headers and the stack headers), so it never covers
 * the header, the tab bar, the FAB or the keyboard. A light card, readable
 * on the dark header and on the light content alike. Screen readers get
 * the message as an announcement. No library needed.
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [headerBottom, setHeaderBottom] = useState<number | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const show = useCallback<ShowToast>((message, icon) => {
    setToast({ id: Date.now(), message, icon });
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setToast(null);
        }
      });
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, opacity]);

  const value = useMemo(() => show, [show]);
  const top = (headerBottom ?? insets.top + SIZES.headerHeight) + SPACING.md;

  return (
    <ToastContext.Provider value={value}>
      <ToastAnchorContext.Provider value={setHeaderBottom}>
        {children}
      </ToastAnchorContext.Provider>
      {toast ? (
        <Animated.View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={[styles.wrap, { top, opacity }]}
        >
          <View style={styles.toast}>
            {toast.icon ? (
              <View style={styles.iconCircle}>{toast.icon}</View>
            ) : null}
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

/** `const showToast = useToast(); showToast('Saved')` */
export const useToast = (): ShowToast => useContext(ToastContext);

/** For headers: report where the header ends, so toasts appear below it. */
export const useToastAnchor = () => useContext(ToastAnchorContext);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  // Callers pass white icons: they sit on an ink circle.
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  text: { ...TYPOGRAPHY.body, flexShrink: 1, color: COLORS.textPrimary },
});
