import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bundle() {
    try {
        console.log('🚀 开始打包部署端服务...');
        await build({
            entryPoints: [path.join(__dirname, '../deploy/index.js')],
            bundle: true,
            platform: 'node',
            target: 'node18',
            format: 'esm',
            outfile: path.join(__dirname, '../deploy/server.mjs'),
            // 排除一些不需要打包的 Node 原生模块
            external: ['fsevents', 'util', 'path', 'url', 'fs', 'net', 'tls', 'http', 'https', 'crypto', 'dns', 'os'],
            banner: {
                js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
            },
        });
        console.log('✅ 打包成功：deploy/server.mjs');
    } catch (err) {
        console.error('❌ 打包失败:', err);
        process.exit(1);
    }
}

bundle();
