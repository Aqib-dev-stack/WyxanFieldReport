/** Limits for a single report, shared by the form and its validation. */
export const REPORT_LIMITS = {
  minImages: 1,
  maxImages: 5,
  /** "Short description": enough for a few sentences, small on a 2G link. */
  descriptionMaxLength: 500,
} as const;
