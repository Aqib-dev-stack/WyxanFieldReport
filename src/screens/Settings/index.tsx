import {
  Check,
  CloudOff,
  FileText,
  Images,
  RotateCcw,
  TriangleAlert,
  X,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  BrandMark,
  ConfirmDialog,
  Screen,
  useToast,
} from '@components';
import {
  COLORS,
  RADIUS,
  SIZES,
  SPACING,
  STATUS_APPEARANCE,
  TYPOGRAPHY,
} from '@config';
import { useStartOver } from '@hooks/useStartOver';

import { version } from '../../../package.json';

import type { RootStackScreenProps } from '@navigation/types';
import type { LucideIcon } from 'lucide-react-native';

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

/** One number about this phone, with its own icon (never colour alone). */
const StatTile = ({
  icon: Icon,
  value,
  label,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  tone?: 'neutral' | 'attention';
}) => {
  const color =
    tone === 'attention'
      ? STATUS_APPEARANCE.waitingNet.color
      : COLORS.textPrimary;
  return (
    <View
      style={styles.tile}
      accessible
      accessibilityLabel={`${value} ${label}`}
    >
      <Icon size={SIZES.iconMd} color={color} />
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
};

const ListItem = ({
  kind,
  text,
}: {
  kind: 'deletes' | 'keeps';
  text: string;
}) => (
  <View style={styles.listItem}>
    <View
      style={[
        styles.listIcon,
        {
          backgroundColor:
            kind === 'deletes'
              ? STATUS_APPEARANCE.failed.tint
              : STATUS_APPEARANCE.uploaded.tint,
        },
      ]}
    >
      {kind === 'deletes' ? (
        <X size={SIZES.iconSm - 2} color={COLORS.danger} strokeWidth={3} />
      ) : (
        <Check
          size={SIZES.iconSm - 2}
          color={STATUS_APPEARANCE.uploaded.color}
          strokeWidth={3}
        />
      )}
    </View>
    <Text style={styles.listText}>{text}</Text>
  </View>
);

/**
 * Settings: what is on this phone, the one deliberate action (Start over,
 * stating exactly what it deletes and what it leaves alone before the user
 * commits; the confirmation names the reports that would be lost), and
 * about the app.
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
            ON THIS PHONE
          </Text>
          <View style={styles.tiles}>
            <StatTile icon={FileText} value={counts.total} label="Reports" />
            <StatTile
              icon={CloudOff}
              value={counts.unsent}
              label="Not uploaded yet"
              tone={hasUnsent ? 'attention' : 'neutral'}
            />
            <StatTile icon={Images} value={counts.photos} label="Photos" />
          </View>
          <Text style={styles.hint}>
            {counts.total === 0
              ? 'No reports are stored on this phone.'
              : hasUnsent
              ? 'Reports not uploaded yet are safe here and will upload on their own.'
              : 'Everything on this phone has reached the server.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            START OVER
          </Text>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <RotateCcw size={SIZES.iconMd} color={COLORS.danger} />
              </View>
              <Text style={styles.cardIntro}>
                Clears this phone so you can begin fresh, for example when
                handing it to another inspector.
              </Text>
            </View>

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
              variant="dangerOutline"
              icon={
                <RotateCcw
                  size={SIZES.iconSm + 2}
                  color={
                    counts.total === 0 ? COLORS.textDisabled : COLORS.danger
                  }
                />
              }
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

        <View style={styles.about} accessible>
          <BrandMark size={40} xColor={COLORS.surface} />
          <View style={styles.aboutText}>
            <Text style={styles.aboutTitle}>WYXAN Field Report</Text>
            <Text style={styles.caption}>Version {version}</Text>
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
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
  },
  tiles: { flexDirection: 'row', gap: SPACING.sm },
  tile: {
    flex: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  tileValue: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  tileLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  card: {
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STATUS_APPEARANCE.failed.tint,
  },
  cardIntro: { ...TYPOGRAPHY.body, flex: 1, color: COLORS.textPrimary },
  listTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  listItem: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  listIcon: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listText: { ...TYPOGRAPHY.body, flex: 1, color: COLORS.textPrimary },
  button: { marginTop: SPACING.lg },
  caption: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  about: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  aboutText: { gap: SPACING.xxs },
  aboutTitle: { ...TYPOGRAPHY.label, color: COLORS.textPrimary },
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
