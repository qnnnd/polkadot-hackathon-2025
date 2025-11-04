const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 配置额外的文件扩展名
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'mjs', 'cjs'];

// 🔧 让 Metro 能够解析目录导入（自动查找 index.js）
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 配置 platformize extensions
config.resolver.platforms = ['ios', 'android'];

// 配置别名
config.resolver.extraNodeModules = {
  '@': __dirname,
  'crypto': require.resolve('crypto-browserify'),
  'stream': require.resolve('readable-stream'),
  'buffer': require.resolve('buffer'),
  'events': require.resolve('events'),
  'process': require.resolve('process'),
  'path': require.resolve('path-browserify'),
  'url': require.resolve('url'),
  'util': require.resolve('util'),
  'assert': require.resolve('assert'),
  'os': require.resolve('os'),
  'querystring': require.resolve('querystring'),
  'http': require.resolve('stream-http'),
  'https': require.resolve('https-browserify'),
  'net': require.resolve('react-native-tcp-socket'),
  'tls': require.resolve('react-native-tcp-socket'),
  'zlib': require.resolve('browserify-zlib'),
  'fs': path.resolve(__dirname, 'mobile/polyfills/fs-mock.js'),
};

// 排除不需要打包的文件和目录
config.resolver.blockList = [
  // 排除 Next.js 相关文件
  /\.next\/.*/,
  /out\/.*/,
];

// 监听文件变化
config.watchFolders = [
  __dirname,
];

module.exports = config;



