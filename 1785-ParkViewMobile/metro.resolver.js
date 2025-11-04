/**
 * Metro 自定义解析器
 * 修复 @reown/appkit-ui-react-native 的目录导入问题
 */

function customResolver(context, moduleName, platform) {
  // 修复 @reown/appkit-ui-react-native 包中的目录导入
  if (
    context.originModulePath &&
    context.originModulePath.includes('@reown/appkit-ui-react-native/lib/commonjs/index.js')
  ) {
    // 将 ./layout/xxx 或 ./composites/xxx 目录导入转换为明确的文件路径
    if (moduleName.match(/^\.\/(layout|composites)\//)) {
      // 先尝试默认解析
      try {
        return context.resolveRequest(context, moduleName, platform);
      } catch (e) {
        // 如果失败，尝试添加 /index
        try {
          return context.resolveRequest(context, moduleName + '/index', platform);
        } catch (e2) {
          // 都失败了，抛出原始错误
          throw e;
        }
      }
    }
  }

  // 使用默认解析器
  return context.resolveRequest(context, moduleName, platform);
}

module.exports = customResolver;
