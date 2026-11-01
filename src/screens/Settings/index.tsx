import { Check, RotateCcw, TriangleAlert, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, ConfirmDialog, Screen, useToast } from '@components';
import {
  COLORS,
  RADIUS,
  SIZES,
  SPACING,
  STATUS_APPEARANCE,
  TYPOGRAPHY,
} from '@config';
import { useStartOver } from '@hooks/useStartOver';
import { formatPhotoCount } from '@utils/formatters';

import type { RootStackScreenProps } from '@navigation/types';

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

const ListItem = ({
  kind,
  text,
}: {
  kind: 'deletes' | 'keeps';
  text: string;
}) => (
  <View style={styles.listItem}>
    {kind === 'deletes' ? (
      <X size={SIZES.iconSm + 2} color={COLORS.danger} strokeWidth={2.5} />
    ) : (
      <Check
        size={SIZES.iconSm + 2}
        color={STATUS_APPEARANCE.uploaded.color}
        strokeWidth={2.5}
      />
    )}
    <Text style={styles.listText}>{text}</Text>
  </View>
);

/**
 * Settings holds one deliberate action: Start over. The screen states
 * exactly what it deletes and what it leaves alone before the user commits,
 * and the confirmation names the reports that would be lost.
 */
const Settings = ({ navigation }: RootStackScreenProps<'Settings'>) => {
  const { counts, isResetting, startOver } = useStartOver();
  const showToast = useToast();
  const [confirming, setConfirming] = useState(false);

  const onConfirm = useCallback(async () => {
    setConfirming(false);
    await startOver();
    showToast(
      'Started over. Reports on the server are untouched.',
      <RotateCcw size={SIZES.iconMd} color={COLORS.onPrimary} />,
    );
    navigation.popTo('MainTabs', { screen: 'Outbox' });
  }, [navigation, showToast, startOver]);

  const hasUnsent = counts.unsent > 0;

  return (
    <Screen scroll padded={false} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            On this phone
          </Text>
          <View style={styles.card}>
            <Text style={styles.body}>
              {counts.total === 0
                ? 'No reports are stored on this phone.'
                : `${plural(counts.total, 'report')} (${formatPhotoCount(
                    counts.photos,
                  )}). ${
                    hasUnsent
                      ? `${counts.unsent} of them ${
                          counts.unsent === 1 ? "hasn't" : "haven't"
                        } reached the server yet.`
                      : 'All of them are on the server.'
                  }`}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Start over
          </Text>
          <View style={styles.card}>
            <Text style={styles.body}>
              Clears this phone so you can begin fresh, for example when handing
              it to another inspector.
            </Text>

            <Text style={styles.listTitle}>Deletes from this phone</Text>
            <ListItem
              kind="deletes"
              text="All reports, including any not uploaded yet"
            />
            <ListItem kind="deletes" text="The app's copies of their photos" />
            <ListItem kind="deletes" text="Upload progress and retry history" />

            <Text style={styles.listTitle}>Keeps</Text>
            <ListItem
              kind="keeps"
              text="Reports already on the server. They stay there and still show under On server."
            />
            <ListItem
              kind="keeps"
              text="Photos in your phone's own gallery. Only the app's copies are deleted."
            />

            <AppButton
              title="Start over…"
              variant="danger"
              loading={isResetting}
              disabled={counts.total === 0}
              accessibilityHint="Asks for confirmation before deleting anything"
              onPress={() => setConfirming(true)}
              style={styles.button}
            />
            {counts.total === 0 ? (
              <Text style={styles.caption}>Nothing to clear.</Text>
            ) : null}
          </View>
        </View>
      </View>

      <ConfirmDialog
        visible={confirming}
        title="Start over?"
        message={`This deletes ${plural(
          counts.total,
          'report',
        )} from this phone. It can't be undone. Reports on the server are not affected.`}
        confirmLabel={
          hasUnsent
            ? `Delete, including ${counts.unsent} unsent`
            : `Delete ${plural(counts.total, 'report')}`
        }
        cancelLabel="Keep my reports"
        destructive
        onConfirm={() => {
          onConfirm().catch(() => undefined);
        }}
        onCancel={() => setConfirming(false)}
      >
        {hasUnsent ? (
          <View style={styles.warning} accessibilityRole="alert">
            <TriangleAlert size={SIZES.iconMd} color={COLORS.danger} />
            <Text style={styles.warningText}>
              {plural(counts.unsent, 'report')}{' '}
              {counts.unsent === 1 ? "hasn't" : "haven't"} reached the server.
              {counts.unsent === 1 ? ' It' : ' They'} will be lost for good.
            </Text>
          </View>
        ) : null}
      </ConfirmDialog>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.xl },
  section: { gap: SPACING.sm },
  sectionTitle: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  card: {
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  body: { ...TYPOGRAPHY.body, color: COLORS.textPrimary },
  listTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  listItem: { flexDirection: 'row', gap: SPACING.sm },
  listText: { ...TYPOGRAPHY.body, flex: 1, color: COLORS.textPrimary },
  button: { marginTop: SPACING.md },
  caption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  warning: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: STATUS_APPEARANCE.failed.tint,
  },
  warningText: { ...TYPOGRAPHY.body, flex: 1, color: COLORS.danger },
});

export default Settings;
