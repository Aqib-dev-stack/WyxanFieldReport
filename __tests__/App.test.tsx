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

/** Finds a pressable by its accessibility label, like a screen reader would. */
const pressByLabel = async (renderer: Renderer, label: string) => {
  const target = renderer.root.find(
    (node: ReactTestInstance) =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  );
  await ReactTestRenderer.act(async () => target.props.onPress());
};

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

describe('App', () => {
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

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

    // Outbox (home)
    expect(texts(app)).toContain('Needs attention · 1');

    // Compose, then back
    await pressByLabel(app, 'New report');
    expect(texts(app)).toContain('Save report');
    await pressByLabel(app, 'Go back');

    // Settings, then back
    await pressByLabel(app, 'Settings');
    expect(texts(app)).toContain('Deletes from this phone');
    await pressByLabel(app, 'Go back');

    // On server: skeleton first, then the list from the mock server
    await pressByLabel(app, 'On server, reports the server holds');
    expect(texts(app)).toContain('Checking the server…');
    await ReactTestRenderer.act(() => wait(1000));
    expect(texts(app).some(t => t.includes('Pipe rack support P-17'))).toBe(
      true,
    );

    // Unmount inside act so navigator effects finish before Jest tears down.
    await ReactTestRenderer.act(async () => app.unmount());
  });
});
