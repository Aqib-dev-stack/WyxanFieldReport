/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

test('opens on the Outbox tab', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const texts = renderer!.root
    .findAll(node => typeof node.props.children === 'string')
    .map(node => node.props.children);
  expect(texts).toContain('Outbox');
  expect(texts).toContain('No reports yet');

  // Unmount inside act so navigator effects finish before Jest tears down.
  await ReactTestRenderer.act(async () => renderer!.unmount());
});
