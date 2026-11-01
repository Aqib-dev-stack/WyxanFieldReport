import { useCallback, useMemo, useState } from 'react';

import { REPORT_LIMITS } from '@config';
import { addMockReport } from '@mocks';
import { isDraftValid, validateReportDraft } from '@utils/validation';

import type { DraftPhoto } from '@app-types';

export type ComposePhase = 'editing' | 'saving' | 'saved';

/**
 * State and rules of the Compose form: description, photos, validation and
 * saving. No navigation, no UI. UI phase: saving writes to the mock store;
 * phase 3 swaps in the report service (DB transaction), same `submit`.
 */
export const useComposeForm = () => {
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [phase, setPhase] = useState<ComposePhase>('editing');

  const errors = useMemo(
    () => validateReportDraft({ description, photoCount: photos.length }),
    [description, photos.length],
  );
  const isValid = isDraftValid(errors);
  const isDirty = description.trim().length > 0 || photos.length > 0;
  const remainingPhotos = REPORT_LIMITS.maxImages - photos.length;

  const addPhotos = useCallback((newPhotos: DraftPhoto[]) => {
    // The cap is enforced here too, not only by hiding the add button.
    setPhotos(prev =>
      [...prev, ...newPhotos].slice(0, REPORT_LIMITS.maxImages),
    );
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  }, []);

  const touchDescription = useCallback(() => setDescriptionTouched(true), []);

  /** Saves the report on the phone. Returns false if it isn't valid. */
  const submit = useCallback(async (): Promise<boolean> => {
    if (!isValid || phase !== 'editing') {
      setDescriptionTouched(true);
      return false;
    }
    setPhase('saving');
    addMockReport({ description: description.trim(), photos });
    setPhase('saved');
    return true;
  }, [description, isValid, phase, photos]);

  return {
    description,
    setDescription,
    touchDescription,
    descriptionTouched,
    photos,
    addPhotos,
    removePhoto,
    remainingPhotos,
    errors,
    isValid,
    isDirty,
    phase,
    submit,
  };
};
