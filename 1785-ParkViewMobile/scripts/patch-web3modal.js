#!/usr/bin/env node
/**
 * 自动修补 @web3modal/ui-react-native 的目录导入问题
 * 
 * 问题: lib/commonjs/index.js 使用目录导入 require("./layout/wui-overlay")
 * 解决: 添加 /index 后缀变为 require("./layout/wui-overlay/index")
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/@web3modal/ui-react-native/lib/commonjs/index.js');

// 检查文件是否存在
if (!fs.existsSync(filePath)) {
  console.log('⚠️  Web3Modal UI file not found, skipping patch...');
  process.exit(0);
}

// 读取文件内容
let content = fs.readFileSync(filePath, 'utf8');

// 检查是否需要补丁 (如果已经是原始状态或已修复,跳过)
if (!content.includes('require("./layout/wui-overlay")') && !content.includes('require("./layout/wui-overlay/index.js")')) {
  console.log('✅ Web3Modal UI does not need patching');
  process.exit(0);
}

// 回退到不带 /index 的原始导入,让 Metro 自己处理
const patches = [
  { from: 'require("./layout/wui-overlay/index.js")', to: 'require("./layout/wui-overlay")' },
  { from: 'require("./layout/wui-flex/index.js")', to: 'require("./layout/wui-flex")' },
  { from: 'require("./layout/wui-separator/index.js")', to: 'require("./layout/wui-separator")' },
  { from: 'require("./layout/wui-overlay/index")', to: 'require("./layout/wui-overlay")' },
  { from: 'require("./layout/wui-flex/index")', to: 'require("./layout/wui-flex")' },
  { from: 'require("./layout/wui-separator/index")', to: 'require("./layout/wui-separator")' }
];

patches.forEach(({ from, to }) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Web3Modal UI patched successfully!');
console.log('   Restored original directory imports (Metro will handle index resolution)');
