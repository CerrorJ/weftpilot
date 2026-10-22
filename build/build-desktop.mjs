import { build } from 'esbuild'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

if (!existsSync('.kernel/package/artifact-lock.json'))
  throw new Error('请先运行 pnpm kernel:assemble')
const alias = { '@weftpilot/agent-team-kernel/protocol': './.kernel/package/protocol.js' }
await mkdir('dist/renderer', { recursive: true })
await build({
  entryPoints: ['apps/desktop/main/index.ts'],
  outfile: 'dist/main.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron'],
  alias,
})
await build({
  entryPoints: ['apps/desktop/preload/index.ts'],
  outfile: 'dist/preload.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron'],
  alias,
})
await build({
  entryPoints: ['apps/desktop/renderer/index.tsx'],
  outfile: 'dist/renderer/app.js',
  bundle: true,
  platform: 'browser',
  format: 'esm',
  jsx: 'automatic',
  alias,
})
await cp('apps/desktop/renderer/index.html', 'dist/renderer/index.html')
await cp('assets/brand', 'dist/renderer/brand', { recursive: true })
await cp('.kernel/package', 'dist/kernel', { recursive: true })
await cp('config/kernel-lock.json', 'dist/kernel-lock.json')
const notices = await Promise.all(
  ['react', 'react-dom', 'zod'].map(
    async (name) => `${name}\n${await readFile(`node_modules/${name}/LICENSE`, 'utf8')}`,
  ),
)
await writeFile('dist/THIRD-PARTY-NOTICES.txt', notices.join('\n\n'))
const metadata = JSON.parse(await readFile('package.json', 'utf8'))
await mkdir('.kernel/desktop-app', { recursive: true })
await cp('dist', '.kernel/desktop-app/dist', { recursive: true })
await cp('package.json', '.kernel/desktop-app/package.json')
console.log(`桌面构建完成 ${metadata.version}`)
