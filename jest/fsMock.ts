/**
 * Jest stand-in for `@dr.pogodin/react-native-fs` (native). Keeps an
 * in-memory set of paths so code that copies and deletes files can run.
 */
const files = new Set<string>();

export const DocumentDirectoryPath = '/app/documents';
export const CachesDirectoryPath = '/app/cache';

export const mkdir = jest.fn(async (_path: string) => undefined);
export const exists = jest.fn(async (path: string) =>
  [...files].some(file => file === path || file.startsWith(`${path}/`)),
);
export const copyFile = jest.fn(async (_from: string, to: string) => {
  files.add(to);
});
export const moveFile = jest.fn(async (from: string, to: string) => {
  files.delete(from);
  files.add(to);
});
export const unlink = jest.fn(async (path: string) => {
  [...files]
    .filter(file => file === path || file.startsWith(`${path}/`))
    .forEach(file => files.delete(file));
});
