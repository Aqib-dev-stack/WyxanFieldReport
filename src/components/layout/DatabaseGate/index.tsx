import { DatabaseZap } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@config';
import { useDatabaseReady } from '@hooks/useDatabaseReady';

import BrandSplash from '../../brand/BrandSplash';
import AppButton from '../../common/AppButton';
import EmptyState from '../../common/EmptyState';

import type { ReactNode } from 'react';

/**
 * Startup: the animated splash plays while the database opens and migrates.
 * The app renders underneath as soon as the database is ready (so no screen
 * can query a missing table), and the splash fades away to reveal it. If
 * opening fails, the splash gives way to a retry screen; nothing is deleted.
 */
const DatabaseGate = ({ children }: { children: ReactNode }) => {
  const { status, retry } = useDatabaseReady();
  const [splashHidden, setSplashHidden] = useState(false);
  const hideSplash = useCallback(() => setSplashHidden(true), []);

  return (
    <View style={styles.root}>
      {status === 'ready' ? (
        children
      ) : status === 'failed' && splashHidden ? (
        <EmptyState
          icon={<DatabaseZap size={48} color={COLORS.danger} />}
          title="Couldn't open this phone's report storage"
          message="Your saved reports are not deleted. Try again; if it keeps failing, restart the app."
          action={<AppButton title="Try again" onPress={retry} />}
        />
      ) : null}
      {splashHidden ? null : (
        <BrandSplash ready={status !== 'opening'} onHidden={hideSplash} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});

export default DatabaseGate;
