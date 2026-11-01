import { ShieldAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';

import AppButton from '../../common/AppButton';

import type { PhotoSource } from '@app-types';

export type PermissionNoticeProps = {
  source: PhotoSource;
  onOpenSettings: () => void;
  onDismiss: () => void;
};

const COPY: Record<PhotoSource, { title: string; message: string }> = {
  camera: {
    title: 'Camera access is off',
    message:
      'To take photos here, allow Camera for this app in Settings. You can still choose photos from the gallery.',
  },
  gallery: {
    title: 'Photo access is off',
    message:
      'To choose photos, allow Photos for this app in Settings. You can still take photos with the camera.',
  },
};

/**
 * Shown when the OS has blocked a permission and won't ask again. Says what
 * is wrong, how to fix it, and the way around it. When the user comes back
 * from Settings the permission is checked again (phase 3), no restart needed.
 */
const PermissionNotice = ({
  source,
  onOpenSettings,
  onDismiss,
}: PermissionNoticeProps) => {
  const { title, message } = COPY[source];

  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.header}>
        <ShieldAlert size={SIZES.iconMd} color={COLORS.warning} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <AppButton
          title="Open Settings"
          onPress={onOpenSettings}
          style={styles.action}
        />
        <AppButton
          title="Not now"
          variant="secondary"
          onPress={onDismiss}
          style={styles.action}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FBF3E4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9CF9E',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: { ...TYPOGRAPHY.headline, color: COLORS.textPrimary, flex: 1 },
  message: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  action: { flex: 1 },
});

export default PermissionNotice;
