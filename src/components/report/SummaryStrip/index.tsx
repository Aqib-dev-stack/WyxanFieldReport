import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SIZES, SPACING, STATUS_APPEARANCE, TYPOGRAPHY } from '@config';

import type { StatusAppearance } from '@config';
import type { OutboxSummary } from '@utils/reportStatus';

export type SummaryStripProps = {
  summary: OutboxSummary;
};

type Part = { key: string; text: string; appearance: StatusAppearance };

/**
 * One line that answers "is my work safe and moving?" before the user reads
 * any card: "2 waiting · 1 uploading · 1 failed · 2 uploaded". Zero counts
 * are left out. When nothing is left to send it says so plainly.
 */
const SummaryStrip = ({ summary }: SummaryStripProps) => {
  const { waiting, uploading, failed, uploaded } = summary;
  const allDone = waiting + uploading + failed === 0;

  const parts: Part[] = allDone
    ? [
        {
          key: 'done',
          text: 'Everything is uploaded',
          appearance: STATUS_APPEARANCE.uploaded,
        },
      ]
    : (
        [
          { key: 'failed', count: failed, word: 'failed', status: 'failed' },
          {
            key: 'uploading',
            count: uploading,
            word: 'uploading',
            status: 'uploading',
          },
          { key: 'waiting', count: waiting, word: 'waiting', status: 'queued' },
          {
            key: 'uploaded',
            count: uploaded,
            word: 'uploaded',
            status: 'uploaded',
          },
        ] as const
      )
        .filter(part => part.count > 0)
        .map(part => ({
          key: part.key,
          text: `${part.count} ${part.word}`,
          appearance: STATUS_APPEARANCE[part.status],
        }));

  return (
    <View
      style={styles.strip}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={parts.map(part => part.text).join(', ')}
    >
      {parts.map(({ key, text, appearance: { icon: Icon, color } }) => (
        <View key={key} style={styles.part}>
          <Icon size={SIZES.iconSm} color={color} />
          <Text style={[styles.text, { color }]}>{text}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: SPACING.lg,
    rowGap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  part: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  text: { ...TYPOGRAPHY.label },
});

export default SummaryStrip;
