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
export const stat = jest.fn(async (_path: string) => ({ size: 1_000_000 }));
export const hash = jest.fn(async (_path: string) => 'f'.repeat(64));
export const readDir = jest.fn(async (dir: string) =>
  [...files]
    .filter(file => file.startsWith(`${dir}/`))
    .map(file => {
      const rest = file.slice(dir.length + 1);
      const name = rest.split('/')[0] ?? rest;
      const isDir = rest.includes('/');
      return {
        name,
        path: `${dir}/${name}`,
        size: 0,
        mtime: null,
        ctime: null,
        isDirectory: () => isDir,
        isFile: () => !isDir,
      };
    })
    .filter(
      (entry, index, all) =>
        all.findIndex(e => e.path === entry.path) === index,
    ),
);
/** Test helper: pretend a file exists. */
export const __addFile = (path: string) => files.add(path);
export const __files = () => [...files];
export const unlink = jest.fn(async (path: string) => {
  [...files]
    .filter(file => file === path || file.startsWith(`${path}/`))
    .forEach(file => files.delete(file));
});
