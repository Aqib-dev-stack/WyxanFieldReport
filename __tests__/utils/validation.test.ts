import { isDraftValid, validateReportDraft } from '@utils/validation';

const validate = (description: string, photoCount: number) =>
  validateReportDraft({ description, photoCount });

describe('validateReportDraft', () => {
  it('accepts a description and 1 to 5 photos', () => {
    expect(isDraftValid(validate('Crack in wall', 1))).toBe(true);
    expect(isDraftValid(validate('Crack in wall', 5))).toBe(true);
  });

  it('rejects 0 and 6 photos', () => {
    expect(validate('Crack', 0).photos).toBe('required');
    expect(validate('Crack', 6).photos).toBe('tooMany');
  });

  it('treats a whitespace-only description as blank', () => {
    expect(validate('', 1).description).toBe('required');
    expect(validate('   \n\t ', 1).description).toBe('required');
  });

  it('rejects a description over 500 characters, ignoring outer spaces', () => {
    expect(validate('a'.repeat(501), 1).description).toBe('tooLong');
    expect(validate(` ${'a'.repeat(500)} `, 1).description).toBeNull();
  });
});
