const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 预构建脚本
 * 负责清理旧构建产物、构建前端和后端、复制必要文件
 */

// 颜色输出辅助函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, colors.bright + colors.blue);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

/**
 * 执行命令并显示输出
 */
function exec(command, cwd = process.cwd()) {
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
      encoding: 'utf-8'
    });
    return true;
  } catch (error) {
    logError(`命令执行失败: ${command}`);
    throw error;
  }
}

/**
 * 清理旧的构建产物
 */
async function cleanBuildArtifacts() {
  logStep('1/7', '清理旧的构建产物');
  
  const dirsToClean = [
    'electron/dist',
    'dist-release'
  ];
  
  for (const dir of dirsToClean) {
    const dirPath = path.resolve(dir);
    if (await fs.pathExists(dirPath)) {
      log(`  删除目录: ${dir}`);
      try {
        await fs.remove(dirPath);
        logSuccess(`已删除: ${dir}`);
      } catch (error) {
        if (error.code === 'EBUSY' || error.code === 'EPERM') {
          logWarning(`无法删除 ${dir}（文件被占用），将尝试覆盖写入`);
        } else {
          throw error;
        }
      }
    } else {
      log(`  目录不存在，跳过: ${dir}`);
    }
  }
  
  logSuccess('清理完成');
}

const TEMP_BUILD_DIR = path.resolve('temp_build');

/**
 * 构建前端应用
 */
function buildFrontend() {
  logStep('2/7', '构建前端应用');
  
  log('  执行命令: node scripts/build-frontend.mjs');
  exec(`node "${path.resolve('scripts/build-frontend.mjs')}"`);
  
  logSuccess('前端构建完成');
}

/**
 * 复制前端构建产物到electron/dist
 */
async function copyFrontendArtifacts() {
  logStep('3/7', '复制前端构建产物');
  
  const srcDir = TEMP_BUILD_DIR;
  const destDir = path.resolve('electron/dist');
  const rootDistDir = path.resolve('dist');
  
  if (!await fs.pathExists(srcDir)) {
    throw new Error(`前端构建产物目录不存在: ${srcDir}`);
  }
  
  // 1. 复制到 electron/dist (保持原有逻辑)
  log(`  从: ${srcDir}`);
  log(`  到: ${destDir}`);
  
  await fs.copy(srcDir, destDir, {
    overwrite: true,
    errorOnExist: false
  });

  // 2. 复制到 dist (供 electron-builder extraResources 使用)
  log(`  到: ${rootDistDir}`);
  await fs.ensureDir(rootDistDir);
  await fs.copy(srcDir, rootDistDir, {
    overwrite: true,
    errorOnExist: false
  });
  
  // 验证复制结果
  const files = await fs.readdir(destDir);
  log(`  已复制 ${files.length} 个文件/目录`);
  
  logSuccess('前端产物复制完成');
}

/**
 * 复制应用图标
 */
async function copyAppIcon() {
  logStep('4/7', '复制应用图标');
  
  const srcIcon = path.resolve('public/app.ico');
  const destIcon = path.resolve('electron/app.ico');
  
  if (!await fs.pathExists(srcIcon)) {
    logWarning(`图标文件不存在: ${srcIcon}`);
    logWarning('将跳过图标复制，应用可能使用默认图标');
    return;
  }
  
  log(`  从: ${srcIcon}`);
  log(`  到: ${destIcon}`);
  
  await fs.copy(srcIcon, destIcon, {
    overwrite: true
  });
  
  logSuccess('图标复制完成');
}

/**
 * 打包后端服务器 (使用 esbuild)
 */
function bundleBackend() {
  logStep('5/7', '打包后端服务器');
  
  const serverSrc = path.resolve('server/src/index.ts');
  const serverOut = path.resolve('electron/server/index.mjs');
  const serverOutDir = path.dirname(serverOut);
  
  if (!fs.existsSync(serverSrc)) {
    logError(`后端源码不存在: ${serverSrc}`);
    process.exit(1);
  }
  
  // 确保输出目录存在
  fs.ensureDirSync(serverOutDir);
  
  log(`  输入: ${serverSrc}`);
  log(`  输出: ${serverOut}`);
  
  // 使用 esbuild 打包
  // --bundle: 打包所有依赖
  // --platform=node: 目标平台为 Node.js
  // --format=esm: 输出 ES Module
  // --external:ws: 排除 ws (如果有原生依赖问题，但在 Node 环境通常不需要排除，除非有 .node 文件)
  // 这里我们尝试完全打包，如果有问题再排除
  // 增加 banner 修复 dynamic require of "path" is not supported 问题
  const cmd = `npx esbuild "${serverSrc}" --bundle --platform=node --target=node18 --format=esm --outfile="${serverOut}" --minify --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"`;
  
  log('  执行 esbuild...');
  exec(cmd);
  
  logSuccess('后端打包完成');
}



/**
 * 显示构建摘要
 */
async function showBuildSummary() {
  logStep('7/7', '构建摘要');
  
  const summary = [];
  
  // 检查前端产物
  const frontendDist = path.resolve('electron/dist');
  if (await fs.pathExists(frontendDist)) {
    summary.push(`✓ 前端产物: electron/dist`);
  }
  
  // 检查后端服务器
  const serverPath = path.resolve('electron/server/index.mjs');
  if (await fs.pathExists(serverPath)) {
    summary.push(`✓ 后端服务器: electron/server/index.mjs`);
  }
  
  // 检查图标
  const iconPath = path.resolve('electron/app.ico');
  if (await fs.pathExists(iconPath)) {
    summary.push(`✓ 应用图标: electron/app.ico`);
  }
  
  log('');
  summary.forEach(item => log(`  ${item}`, colors.green));
  log('');
  
  logSuccess('预构建流程全部完成！');
  log('\n现在可以运行 "npm run build:electron" 来打包应用');
}

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();
  
  log('\n' + '='.repeat(60), colors.bright);
  log('  Electron 应用预构建脚本', colors.bright + colors.blue);
  log('='.repeat(60) + '\n', colors.bright);
  
  try {
    await cleanBuildArtifacts();
    buildFrontend();
    await copyFrontendArtifacts();
    await copyAppIcon();
    bundleBackend();
    // installBackendDependencies(); // 不需要安装依赖，已打包
    await showBuildSummary();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n总耗时: ${duration}秒`, colors.bright + colors.green);
    
    process.exit(0);
  } catch (error) {
    logError('\n预构建过程中发生错误:');
    console.error(error);
    process.exit(1);
  }
}

// 运行主函数
main();
