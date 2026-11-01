import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@config';

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
    padding: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  action: { marginTop: 24, alignSelf: 'stretch' },
});

export default EmptyState;
