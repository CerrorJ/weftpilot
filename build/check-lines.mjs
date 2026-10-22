import { readdir, readFile } from 'node:fs/promises'

const inspect = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) await inspect(path)
    else if (/\.(mjs|ts|tsx|js)$/.test(path)) await check(path)
  }
}
const check = async (path) => {
  const count = (await readFile(path, 'utf8')).trimEnd().split('\n').length
  const limit = path.startsWith('tests/') ? 800 : 500
  if (count > limit) throw new Error(`${path}: ${count} 行，超过 ${limit} 行`)
}
for (const directory of ['apps', 'packages', 'build', 'tests']) await inspect(directory)
