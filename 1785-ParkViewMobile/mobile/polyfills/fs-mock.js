// Mock fs module for React Native
// node-gyp-build needs this but doesn't actually use it in React Native
module.exports = {
  existsSync: () => false,
  readFileSync: () => '',
  readdirSync: () => [],
  statSync: () => ({ isDirectory: () => false }),
  readFile: (path, cb) => cb(null, ''),
  writeFile: (path, data, cb) => cb(null),
  mkdir: (path, cb) => cb(null),
  rmdir: (path, cb) => cb(null),
  unlink: (path, cb) => cb(null),
};
