#!/usr/bin/env node

/**
 * 修复 @web3modal/ui-react-native 的目录导入问题
 * 移除 package.json 中的 react-native 字段，强制使用编译后的代码
 */

const fs = require('fs');
const path = require('path');

const packagePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@web3modal',
  'ui-react-native',
  'package.json'
);

try {
  console.log('🔧 修复 @web3modal/ui-react-native...');
  
  if (!fs.existsSync(packagePath)) {
    console.log('⚠️  包不存在，跳过修复');
    process.exit(0);
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (pkg['react-native']) {
    console.log('   移除 react-native 字段:', pkg['react-native']);
    delete pkg['react-native'];
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('✅ 修复完成！');
  } else {
    console.log('✅ 已经修复过了');
  }
} catch (error) {
  console.error('❌ 修复失败:', error.message);
  process.exit(1);
}
