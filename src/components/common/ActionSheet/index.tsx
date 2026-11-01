import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';

import type { ReactNode } from 'react';

export type ActionSheetOption = {
  key: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

export type ActionSheetProps = {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
};

/**
 * Bottom sheet with a few choices, built on RN `Modal` (no gesture or
 * animation library needed for two options). Closes on backdrop tap, the
 * Android back button, or Cancel. The sheet closes before an option runs,
 * so a camera or gallery screen never opens on top of the modal.
 */
const ActionSheet = ({
  visible,
  title,
  options,
  onClose,
}: ActionSheetProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.sm }]}
        >
          {title ? (
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          ) : null}

          {options.map(option => (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              android_ripple={{ color: COLORS.ripple }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => {
                onClose();
                option.onPress();
              }}
            >
              {option.icon}
              <Text style={styles.label}>{option.label}</Text>
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            android_ripple={{ color: COLORS.ripple }}
            style={({ pressed }) => [
              styles.row,
              styles.cancel,
              pressed && styles.pressed,
            ]}
            onPress={onClose}
          >
            <Text style={[styles.label, styles.cancelLabel]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20, 32, 46, 0.45)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  row: {
    minHeight: SIZES.hitTarget + SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  pressed: { backgroundColor: COLORS.surfaceMuted },
  label: { ...TYPOGRAPHY.body, fontWeight: '600', color: COLORS.textPrimary },
  cancel: {
    justifyContent: 'center',
    marginTop: SPACING.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    borderRadius: 0,
  },
  cancelLabel: { color: COLORS.textSecondary },
});

export default ActionSheet;
