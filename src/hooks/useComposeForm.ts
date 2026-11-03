import { useCallback, useMemo, useState } from 'react';

import { REPORT_LIMITS } from '@config';
import { reportService } from '@services';
import { isDraftValid, validateReportDraft } from '@utils/validation';

import type { DraftPhoto } from '@app-types';

export type ComposePhase = 'editing' | 'saving' | 'saved';

/**
 * State and rules of the Compose form: description, photos, validation and
 * saving. No navigation, no UI. Saving goes through the report service
 * (copy photos into app storage, then one database transaction).
 */
export const useComposeForm = () => {
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [phase, setPhase] = useState<ComposePhase>('editing');
  const [saveFailed, setSaveFailed] = useState(false);

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

  const removePhoto = useCallback(
    (id: string) => {
      // The picker's temporary copy of a removed photo is deleted right away.
      reportService
        .discardPickedPhotos(photos.filter(photo => photo.id === id))
        .catch(() => undefined);
      setPhotos(prev => prev.filter(photo => photo.id !== id));
    },
    [photos],
  );

  /** Leaving without saving: drop the picker's temporary copies too. */
  const discard = useCallback(() => {
    reportService.discardPickedPhotos(photos).catch(() => undefined);
  }, [photos]);

  const touchDescription = useCallback(() => setDescriptionTouched(true), []);

  /**
   * Saves the report on the phone. Returns false if it isn't valid or the
   * save failed; on failure the form keeps everything so the user can retry.
   */
  const submit = useCallback(async (): Promise<boolean> => {
    if (!isValid || phase !== 'editing') {
      setDescriptionTouched(true);
      return false;
    }
    setPhase('saving');
    setSaveFailed(false);
    try {
      await reportService.createReport({ description, photos });
      setPhase('saved');
      return true;
    } catch {
      setPhase('editing');
      setSaveFailed(true);
      return false;
    }
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
    saveFailed,
    submit,
    discard,
  };
};
