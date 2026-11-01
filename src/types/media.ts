/** Where a new photo comes from. */
export type PhotoSource = 'camera' | 'gallery';

/** A photo attached to the report being composed, before it is saved. */
export type DraftPhoto = {
  id: string;
  /** Picked file URI (the picker's temporary copy, file://). */
  uri: string;
  width: number | null;
  height: number | null;
  /** Size of the original as picked; often well over 5 MB. */
  sizeBytes: number | null;
};

/**
 * What a picker returns.
 *   denied   the user said no this time; asking again is allowed
 *   blocked  the OS will no longer ask; only Settings can fix it
 *   error    the picker failed (e.g. no camera on this device)
 */
export type PickResult =
  | { kind: 'picked'; photos: DraftPhoto[] }
  | { kind: 'cancelled' }
  | { kind: 'denied'; source: PhotoSource }
  | { kind: 'blocked'; source: PhotoSource }
  | { kind: 'error'; message: string };
