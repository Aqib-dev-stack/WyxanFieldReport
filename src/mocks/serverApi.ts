import type { ApiResult, ServerReport } from '@app-types';

/**
 * Stand-in for `GET /reports` until the backend exists (phase 5). The
 * scenario can be switched from the dev switcher on the On server screen.
 */

export type ServerScenario = 'ok' | 'empty' | 'error' | 'slow' | 'offline';

export const SERVER_SCENARIOS: ServerScenario[] = [
  'ok',
  'empty',
  'error',
  'slow',
  'offline',
];

let scenario: ServerScenario = 'ok';

export const getServerScenario = () => scenario;
export const setServerScenario = (next: ServerScenario) => {
  scenario = next;
};

const HOUR = 60 * 60 * 1000;
const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * HOUR).toISOString();

const image = (position: number, sizeBytes: number) => ({
  position,
  url: null,
  sizeBytes,
});

const SERVER_REPORTS: ServerReport[] = [
  {
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c07',
    description:
      'Pipe rack support P-17: paint blistering and surface rust over roughly 30 cm. Recommend inspection within a month.',
    images: [image(0, 1_350_000), image(1, 1_770_000), image(2, 2_190_000)],
    createdAt: hoursAgo(20),
    receivedAt: hoursAgo(19.5),
  },
  {
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c08',
    description:
      'Fire extinguisher at control room entrance past its service date.',
    images: [image(0, 1_350_000)],
    createdAt: hoursAgo(52),
    receivedAt: hoursAgo(49),
  },
  {
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c09',
    description:
      'Cable tray C-3 sagging between supports 12 and 13. No damage to cables seen. Support bracket missing one bolt.',
    images: [
      image(0, 2_480_000),
      image(1, 2_010_000),
      image(2, 1_640_000),
      image(3, 2_900_000),
      image(4, 1_920_000),
    ],
    createdAt: hoursAgo(75),
    receivedAt: hoursAgo(74),
  },
  {
    id: 'b6f2c1e0-1d4a-4c51-9b7e-0a1f2e3d4c10',
    description:
      'Weekly walk-round, east compound. All gates locked, lighting OK.',
    images: [image(0, 1_120_000), image(1, 1_480_000)],
    createdAt: hoursAgo(150),
    receivedAt: hoursAgo(150),
  },
];

const wait = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

export const mockFetchServerReports = async (): Promise<
  ApiResult<ServerReport[]>
> => {
  const current = scenario;
  await wait(current === 'slow' ? 4000 : 900);
  switch (current) {
    case 'ok':
    case 'slow':
      // Newest received first, as the API will return them.
      return {
        ok: true,
        data: [...SERVER_REPORTS].sort((a, b) =>
          b.receivedAt.localeCompare(a.receivedAt),
        ),
      };
    case 'empty':
      return { ok: true, data: [] };
    case 'error':
      return { ok: false, error: { kind: 'server', status: 500 } };
    case 'offline':
      return { ok: false, error: { kind: 'offline' } };
  }
};
