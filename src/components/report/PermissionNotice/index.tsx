import { ShieldAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SIZES, SPACING, TYPOGRAPHY } from '@config';

import AppButton from '../../common/AppButton';

import type { PhotoSource } from '@app-types';

export type PermissionNoticeProps = {
  source: PhotoSource;
  /** denied: the app may ask again. blocked: only Settings can grant it. */
  state: 'denied' | 'blocked';
  onAskAgain: () => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
};

const NAME: Record<PhotoSource, string> = {
  camera: 'Camera',
  gallery: 'Photos',
};

const ALTERNATIVE: Record<PhotoSource, string> = {
  camera: 'You can still choose photos from the gallery.',
  gallery: 'You can still take photos with the camera.',
};

/**
 * Shown when a photo permission is refused. Says what is wrong, how to fix
 * it, and the way around it. "Denied" offers to ask again; "blocked" (the
 * OS won't ask any more) sends the user to Settings. Coming back from
 * Settings re-checks the permission, so no restart is needed.
 */
const PermissionNotice = ({
  source,
  state,
  onAskAgain,
  onOpenSettings,
  onDismiss,
}: PermissionNoticeProps) => {
  const name = NAME[source];
  const title = `${name} access is off`;
  const message =
    state === 'blocked'
      ? `To use it here, allow ${name} for this app in Settings. ${ALTERNATIVE[source]}`
      : `The app needs ${name} access for this. ${ALTERNATIVE[source]}`;

  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.header}>
        <ShieldAlert size={SIZES.iconMd} color={COLORS.warning} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {state === 'blocked' ? (
          <AppButton
            title="Open Settings"
            onPress={onOpenSettings}
            style={styles.action}
          />
        ) : (
          <AppButton
            title={`Allow ${name.toLowerCase()}`}
            onPress={onAskAgain}
            style={styles.action}
          />
        )}
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
