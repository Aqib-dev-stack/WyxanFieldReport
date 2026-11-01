/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

import type { ReactTestInstance } from 'react-test-renderer';

type Renderer = ReactTestRenderer.ReactTestRenderer;

const texts = (renderer: Renderer) =>
  renderer.root
    .findAll(node => typeof node.props.children === 'string')
    .map(node => node.props.children as string);

/**
 * Finds a pressable the way a screen reader names it: its accessibility
 * label, or the visible title of a text button.
 */
const pressByLabel = async (renderer: Renderer, label: string) => {
  const target = renderer.root.findAll(
    (node: ReactTestInstance) =>
      (node.props.accessibilityLabel === label || node.props.title === label) &&
      typeof node.props.onPress === 'function',
  )[0];
  if (!target) {
    throw new Error(`No button named "${label}"`);
  }
  await ReactTestRenderer.act(async () => target.props.onPress());
};

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** What GET /reports returns in this test (no real server in Jest). */
const SERVER_LIST = {
  reports: [
    {
      id: '6f1c2a8e-3b4d-4e5f-9a0b-1c2d3e4f5a6b',
      description: 'Pipe rack support P-17: paint blistering',
      createdAt: '2026-11-01T10:00:00.000Z',
      receivedAt: '2026-11-01T10:05:00.000Z',
      images: [{ position: 0, sizeBytes: 2_100_000, url: null }],
    },
  ],
};

describe('App', () => {
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  const realFetch = globalThis.fetch;

  beforeAll(() => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => SERVER_LIST,
    })) as unknown as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error');
    warnSpy = jest.spyOn(console, 'warn');
  });

  afterEach(() => {
    // "No console warnings" is part of the brief; keep it enforced.
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('opens every screen without warnings', async () => {
    let renderer: Renderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
    const app = renderer!;

    // Outbox (home): a fresh install has no reports yet
    expect(texts(app)).toContain('No reports yet');

    // Compose, then back
    await pressByLabel(app, 'New report');
    expect(texts(app)).toContain('Save report');
    await pressByLabel(app, 'Go back');

    // Settings, then back
    await pressByLabel(app, 'Settings');
    expect(texts(app)).toContain('Deletes from this phone');
    await pressByLabel(app, 'Go back');

    // On server: the list comes from GET /reports (faked: no server in Jest)
    await pressByLabel(app, 'On server, reports the server holds');
    await ReactTestRenderer.act(() => wait(50));
    expect(texts(app).some(t => t.includes('Pipe rack support P-17'))).toBe(
      true,
    );

    // Unmount inside act so navigator effects finish before Jest tears down.
    await ReactTestRenderer.act(async () => app.unmount());
  });
});
