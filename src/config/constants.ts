/** Limits for a single report, shared by the form and its validation. */
export const REPORT_LIMITS = {
  minImages: 1,
  maxImages: 5,
  /** "Short description": enough for a few sentences, small on a 2G link. */
  descriptionMaxLength: 500,
  /**
   * Hard upload limit per photo. 5,000,000 bytes, the stricter reading of
   * "5 MB" (5 MiB would be 5,242,880), so we are under it either way.
   */
  maxImageBytes: 5_000_000,
} as const;
