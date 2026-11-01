import { toPickResult } from '@services/media/photoPicker';

let n = 0;
const newId = () => `p${++n}`;
const asset = (i: number) => ({
  uri: `file:///cache/${i}.jpg`,
  width: 4000,
  height: 3000,
  fileSize: 18_000_000,
});

describe('toPickResult', () => {
  it('maps picked assets to draft photos', () => {
    expect(toPickResult({ assets: [asset(1)] }, 5, newId)).toEqual({
      kind: 'picked',
      photos: [
        {
          id: expect.any(String),
          uri: 'file:///cache/1.jpg',
          width: 4000,
          height: 3000,
          sizeBytes: 18_000_000,
        },
      ],
    });
  });

  it('never returns more photos than the slots left', () => {
    const result = toPickResult({ assets: [1, 2, 3, 4].map(asset) }, 2, newId);
    expect(result.kind === 'picked' && result.photos).toHaveLength(2);
  });

  it('treats cancel and empty picks as cancelled', () => {
    expect(toPickResult({ didCancel: true }, 5, newId).kind).toBe('cancelled');
    expect(toPickResult({ assets: [] }, 5, newId).kind).toBe('cancelled');
  });

  it('turns picker errors into a blocked permission or a message', () => {
    expect(toPickResult({ errorCode: 'permission' }, 5, newId)).toEqual({
      kind: 'blocked',
      source: 'camera',
    });
    expect(toPickResult({ errorCode: 'camera_unavailable' }, 5, newId)).toEqual(
      { kind: 'error', message: 'This device has no camera available.' },
    );
  });
});
