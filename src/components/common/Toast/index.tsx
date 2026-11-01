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

const VISIBLE_MS = 4000;
const FADE_MS = 180;

/**
 * Minimal app-wide toast: one message at a time, shown just below the
 * header so it never fights the tab bar, the FAB or the keyboard. Screen
 * readers get the message as an announcement. No library needed.
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
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

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.wrap,
            { top: insets.top + SIZES.headerHeight + SPACING.sm, opacity },
          ]}
        >
          <View style={styles.toast}>
            {toast.icon}
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

/** `const showToast = useToast(); showToast('Saved')` */
export const useToast = (): ShowToast => useContext(ToastContext);

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
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.textPrimary,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  text: { ...TYPOGRAPHY.body, flexShrink: 1, color: COLORS.onPrimary },
});
