import {
  CachesDirectoryPath,
  copyFile,
  DocumentDirectoryPath,
  exists,
  hash,
  mkdir,
  moveFile,
  readDir,
  stat,
  unlink,
} from '@dr.pogodin/react-native-fs';

/**
 * Photos live in the app's private documents folder, one folder per report:
 *   <documents>/reports/<reportId>/<position>-original.<ext>
 * Not the cache: Android may empty the cache at any time, and a queued
 * report must still have its photos after days offline.
 */
export const REPORTS_ROOT = `${DocumentDirectoryPath}/reports`;

export const reportFolder = (reportId: string) => `${REPORTS_ROOT}/${reportId}`;

/**
 * react-native-image-picker hands back its own copy of every photo, in the
 * app's cache folder, named with this prefix. Ours to delete once used.
 */
const PICKER_TEMP_PREFIX = 'rn_image_picker_lib_temp_';

/** `file:///a/b.jpg` → `/a/b.jpg` (file APIs want paths, <Image> wants URIs). */
export const uriToPath = (uri: string) =>
  uri.startsWith('file://') ? decodeURI(uri.slice('file://'.length)) : uri;

const extensionOf = (uri: string) => {
  const match = /\.([a-z0-9]{2,5})(?:\?.*)?$/i.exec(uri);
  return match?.[1]?.toLowerCase() ?? 'jpg';
};

/**
 * True only for the picker's temporary copies inside this app's cache.
 * Anything else (a gallery photo, another app's file) is never deleted.
 */
export const isPickerTempCopy = (uri: string) => {
  const path = uriToPath(uri);
  const name = path.slice(path.lastIndexOf('/') + 1);
  return (
    path.startsWith(`${CachesDirectoryPath}/`) &&
    name.startsWith(PICKER_TEMP_PREFIX)
  );
};

const removeIfPresent = async (path: string) => {
  if (await exists(path)) {
    await unlink(path); // removes folders recursively
  }
};

export type FileStorage = {
  /** Copies a picked photo into the report's folder; returns the new path. */
  copyIntoAppStorage: (
    sourceUri: string,
    reportId: string,
    position: number,
  ) => Promise<string>;
  /**
   * Moves a freshly compressed file to its fixed name in the report folder
   * (`<position>-upload.jpg`), replacing any earlier attempt; returns the path.
   */
  keepUploadFile: (
    tempPath: string,
    reportId: string,
    position: number,
  ) => Promise<string>;
  deleteReportFiles: (reportId: string) => Promise<void>;
  deleteAllReportFiles: () => Promise<void>;
  /** Size in bytes, or null if the file is missing. */
  sizeOf: (path: string) => Promise<number | null>;
  /** SHA-256, computed natively (hashing 5 MB in JS would be slow). */
  sha256: (path: string) => Promise<string>;
  /** Deletes the picker's temporary copy of a photo (no-op for anything else). */
  deletePickerCopy: (uri: string) => Promise<void>;
  /** Deletes every temporary copy the picker left in the cache. */
  clearPickerCopies: () => Promise<void>;
  /** Deletes report folders whose report is not in the database. */
  removeOrphanFolders: (knownReportIds: string[]) => Promise<void>;
};

export const fileStorage: FileStorage = {
  async copyIntoAppStorage(sourceUri, reportId, position) {
    const folder = reportFolder(reportId);
    await mkdir(folder);
    const destination = `${folder}/${position}-original.${extensionOf(
      sourceUri,
    )}`;
    // A retried save may find a half-copied file from a crash: start clean.
    await removeIfPresent(destination);
    await copyFile(uriToPath(sourceUri), destination);
    return destination;
  },
  async keepUploadFile(tempPath, reportId, position) {
    const destination = `${reportFolder(reportId)}/${position}-upload.jpg`;
    await removeIfPresent(destination);
    await moveFile(tempPath, destination);
    return destination;
  },
  deleteReportFiles: reportId => removeIfPresent(reportFolder(reportId)),
  deleteAllReportFiles: () => removeIfPresent(REPORTS_ROOT),
  async sizeOf(path) {
    return (await exists(path)) ? (await stat(path)).size : null;
  },
  sha256: path => hash(path, 'sha256'),

  async deletePickerCopy(uri) {
    if (isPickerTempCopy(uri)) {
      await removeIfPresent(uriToPath(uri));
    }
  },

  async clearPickerCopies() {
    const entries = await readDir(CachesDirectoryPath);
    for (const entry of entries) {
      if (entry.isFile() && entry.name.startsWith(PICKER_TEMP_PREFIX)) {
        await unlink(entry.path);
      }
    }
  },

  async removeOrphanFolders(knownReportIds) {
    if (!(await exists(REPORTS_ROOT))) {
      return;
    }
    const known = new Set(knownReportIds);
    for (const entry of await readDir(REPORTS_ROOT)) {
      if (entry.isDirectory() && !known.has(entry.name)) {
        await unlink(entry.path);
      }
    }
  },
};
