/** Where a new photo comes from. */
export type PhotoSource = 'camera' | 'gallery';

/** A photo attached to the report being composed, before it is saved. */
export type DraftPhoto = {
  id: string;
  /** Picked file URI; `null` for UI-phase mock photos. */
  uri: string | null;
};

/**
 * What a picker returns. `blocked` means the OS permission is denied and
 * the system will no longer ask, so only Settings can fix it.
 */
export type PickResult =
  | { kind: 'picked'; photos: DraftPhoto[] }
  | { kind: 'cancelled' }
  | { kind: 'blocked'; source: PhotoSource };
