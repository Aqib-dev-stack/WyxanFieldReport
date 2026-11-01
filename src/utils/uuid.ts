/**
 * RFC 4122 version-4 UUID from a secure random source
 * (`react-native-get-random-values` on the phone, Node's crypto in Jest).
 * Used for report IDs, which double as the server's idempotency key, so
 * Math.random() (predictable, collision-prone) is not good enough.
 */
export const uuidv4 = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  /* eslint-disable no-bitwise -- setting the version and variant bits */
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  /* eslint-enable no-bitwise */
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
};
