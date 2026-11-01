import { AppButton, EmptyState, Screen } from '@components';

import type { MainTabScreenProps } from '@navigation/types';

/** Placeholder: will list queued, uploading, retrying, done and failed reports. */
const UploadQueue = ({ navigation }: MainTabScreenProps<'UploadQueue'>) => (
  <Screen>
    <EmptyState
      title="No reports waiting"
      message="Reports you submit are saved here until they finish uploading."
      action={
        <AppButton
          title="Create a report"
          onPress={() => navigation.navigate('CreateReport')}
        />
      }
    />
  </Screen>
);

export default UploadQueue;
