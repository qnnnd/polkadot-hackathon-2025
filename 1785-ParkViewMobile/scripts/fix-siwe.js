#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/@web3modal/siwe-react-native/lib/commonjs/index.js'
);

console.log('🔧 修复 @web3modal/siwe-react-native 导入...');

if (!fs.existsSync(filePath)) {
  console.log('⚠️  文件不存在，跳过修复');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

// 备份原文件
const backupPath = filePath + '.backup';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, content);
  console.log('✅ 已创建备份');
}

// 修复错误的导入：../src/client -> ./client
const fixedContent = content.replace(
  'require("../src/client")',
  'require("./client")'
);

if (content !== fixedContent) {
  fs.writeFileSync(filePath, fixedContent);
  console.log('✅ 已修复 SIWE 导入路径');
} else {
  console.log('✅ 已经修复过了');
}
