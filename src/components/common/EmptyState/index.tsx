import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@config';

import type { ReactNode } from 'react';

export type EmptyStateProps = {
  title: string;
  message?: string;
  /** Optional call to action below the message. */
  action?: ReactNode;
};

const EmptyState = ({ title, message, action }: EmptyStateProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {action ? <View style={styles.action}>{action}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.headline,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  message: {
    marginTop: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  action: { marginTop: SPACING.xl, alignSelf: 'stretch' },
});

export default EmptyState;
