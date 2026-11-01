import { DatabaseZap } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@config';
import { useDatabaseReady } from '@hooks/useDatabaseReady';

import AppButton from '../../common/AppButton';
import EmptyState from '../../common/EmptyState';

import type { ReactNode } from 'react';

/**
 * Renders the app only once the database is open and migrated, so no screen
 * can query a missing table. Opening takes a few milliseconds; meanwhile a
 * plain background (no spinner flash). If it fails, says so and offers a
 * retry. Nothing is deleted on failure.
 */
const DatabaseGate = ({ children }: { children: ReactNode }) => {
  const { status, retry } = useDatabaseReady();

  if (status === 'ready') {
    return children;
  }

  return (
    <View style={styles.root}>
      {status === 'failed' ? (
        <EmptyState
          icon={<DatabaseZap size={48} color={COLORS.danger} />}
          title="Couldn't open this phone's report storage"
          message="Your saved reports are not deleted. Try again; if it keeps failing, restart the app."
          action={<AppButton title="Try again" onPress={retry} />}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});

export default DatabaseGate;
