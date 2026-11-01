import { randomBytes } from 'node:crypto';
import { access, mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Image files on disk: <uploadDir>/<reportId>/<position>.jpg.
 * Writes go to a temp file first and are renamed into place, so a crash or
 * a dropped request never leaves a half-written image under the real name.
 */
export const createImageFiles = (uploadDir: string) => {
  const relative = (reportId: string, position: number) =>
    `${reportId}/${position}.jpg`;
  const absolute = (reportId: string, position: number) =>
    join(uploadDir, relative(reportId, position));

  return {
    relative,

    async save(reportId: string, position: number, bytes: Buffer) {
      const folder = join(uploadDir, reportId);
      await mkdir(folder, { recursive: true });
      const temp = join(
        folder,
        `.${position}.${randomBytes(6).toString('hex')}.tmp`,
      );
      await writeFile(temp, bytes);
      await rename(temp, absolute(reportId, position)); // replaces any earlier upload
    },

    /** Size of a stored image, or null if it isn't there. */
    async sizeOf(reportId: string, position: number): Promise<number | null> {
      try {
        return (await stat(absolute(reportId, position))).size;
      } catch {
        return null;
      }
    },

    async exists(reportId: string, position: number) {
      try {
        await access(absolute(reportId, position));
        return true;
      } catch {
        return false;
      }
    },

    async deleteAll() {
      await rm(uploadDir, { recursive: true, force: true });
      await mkdir(uploadDir, { recursive: true });
    },
  };
};

export type ImageFiles = ReturnType<typeof createImageFiles>;
