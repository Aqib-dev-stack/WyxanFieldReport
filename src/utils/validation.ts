import { REPORT_LIMITS } from '@config';

export type DescriptionError = 'required' | 'tooLong';
export type PhotosError = 'required' | 'tooMany';

export type ReportDraftErrors = {
  description: DescriptionError | null;
  photos: PhotosError | null;
};

/**
 * The rules a report must pass before it is saved. Returns codes, not text,
 * so the form decides the wording. Whitespace-only counts as blank.
 */
export const validateReportDraft = ({
  description,
  photoCount,
}: {
  description: string;
  photoCount: number;
}): ReportDraftErrors => {
  const trimmed = description.trim();
  return {
    description:
      trimmed.length === 0
        ? 'required'
        : trimmed.length > REPORT_LIMITS.descriptionMaxLength
        ? 'tooLong'
        : null,
    photos:
      photoCount < REPORT_LIMITS.minImages
        ? 'required'
        : photoCount > REPORT_LIMITS.maxImages
        ? 'tooMany'
        : null,
  };
};

export const isDraftValid = (errors: ReportDraftErrors): boolean =>
  errors.description === null && errors.photos === null;
