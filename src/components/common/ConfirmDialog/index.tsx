import { Modal, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@config';

import AppButton from '../AppButton';

import type { ReactNode } from 'react';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  /** Extra content between the message and the buttons, e.g. a warning. */
  children?: ReactNode;
  /** Name the consequence ("Delete 3 reports"), not "OK". */
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Centered confirmation for actions that can't be undone. Buttons are
 * stacked full width, so long, specific labels fit and stay easy to hit.
 * Android back and the backdrop count as Cancel.
 */
const ConfirmDialog = ({
  visible,
  title,
  message,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    navigationBarTranslucent
    onRequestClose={onCancel}
  >
    <View style={styles.backdrop}>
      <View
        style={styles.dialog}
        accessibilityViewIsModal
        accessibilityRole="alert"
      >
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {children}
        <View style={styles.actions}>
          <AppButton
            title={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
          />
          <AppButton
            title={cancelLabel}
            variant="secondary"
            onPress={onCancel}
          />
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(20, 32, 46, 0.55)',
  },
  dialog: {
    gap: SPACING.md,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  title: { ...TYPOGRAPHY.title, color: COLORS.textPrimary },
  message: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  actions: { gap: SPACING.sm, marginTop: SPACING.sm },
});

export default ConfirmDialog;
