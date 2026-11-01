import { uuidv4 } from '@utils/uuid';

describe('uuidv4', () => {
  it('produces RFC 4122 version-4 UUIDs', () => {
    expect(uuidv4()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 1000 }, uuidv4));
    expect(ids.size).toBe(1000);
  });
});
