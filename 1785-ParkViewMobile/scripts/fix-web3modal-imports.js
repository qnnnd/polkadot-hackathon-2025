#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/@web3modal/ui-react-native/lib/commonjs/index.js'
);

console.log('🔧 修复 @web3modal/ui-react-native 的目录导入...');

if (!fs.existsSync(filePath)) {
  console.log('❌ 文件不存在:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 备份原文件
const backupPath = filePath + '.backup';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, content);
  console.log('✅ 已创建备份:', backupPath);
}

// 策略改变：移除所有 /index.js 和 /index 后缀，恢复原始目录导入
const fixedContent = content.replace(/require\("(\.\/.+?)\/index(\.js)?"\)/g, (match, p1) => {
  return `require("${p1}")`;
});

// 写入修复后的内容
if (content !== fixedContent) {
  fs.writeFileSync(filePath, fixedContent);
  const changesCount = content.split('\n').filter((line, i) => line !== fixedContent.split('\n')[i]).length;
  console.log(`✅ 已修复 ${changesCount} 处导入`);
} else {
  console.log('✅ 已经修复过了');
}

console.log('✅ 修复完成！');
