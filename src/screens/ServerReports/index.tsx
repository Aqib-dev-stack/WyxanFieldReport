import { EmptyState, Screen } from '@components';

/** Placeholder: will fetch and list reports that exist on the backend. */
const ServerReports = () => (
  <Screen>
    <EmptyState
      title="No server reports yet"
      message="Reports confirmed by the server will be listed here."
    />
  </Screen>
);

export default ServerReports;
