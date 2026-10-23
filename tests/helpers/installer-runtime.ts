import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import { dirname, join, relative, isAbsolute, resolve } from 'node:path'
import { z } from 'zod'

const execute = promisify(execFile)
const registryPath =
  'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\bc4ac491-53bb-5b76-859b-e0506a33e933'
const registryPaths = [
  registryPath,
  registryPath.replace('HKCU:', 'HKLM:'),
  registryPath.replace('Software\\', 'Software\\WOW6432Node\\'),
  registryPath.replace('HKCU:', 'HKLM:').replace('Software\\', 'Software\\WOW6432Node\\'),
]
const powershell = join(
  process.env.SystemRoot ?? 'C:/Windows',
  'System32/WindowsPowerShell/v1.0/powershell.exe',
)
const artifactSchema = z.object({
  file: z.string(),
  size: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})
const manifestSchema = z.object({
  formatVersion: z.literal(1),
  appId: z.literal('io.weftpilot.desktop.validation'),
  validation: z.literal(true),
  signing: z.literal('unsigned'),
  platform: z.literal('win32'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  kernelCommit: z.string().regex(/^[a-f0-9]{40}$/),
  artifacts: z.array(artifactSchema),
})

export const validationProfileDirectory = async (): Promise<string> => {
  const { stdout } = await execute(
    powershell,
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      "[Environment]::GetFolderPath('ApplicationData')",
    ],
    { windowsHide: true },
  )
  assert.ok(stdout.trim())
  return join(stdout.trim(), 'WeftPilotValidation')
}

export const validationArtifact = async (manifestPath: string) => {
  const manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')))
  const installer = manifest.artifacts.find((file) =>
    /^WeftPilotValidation-[\d.]+-win-(x64|arm64)\.exe$/.test(file.file),
  )
  assert.ok(installer)
  const path = join(dirname(manifestPath), installer.file)
  const bytes = await readFile(path)
  assert.equal(bytes.length, installer.size)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), installer.sha256)
  return { path, manifest }
}

export const validationRegistration = async () => {
  // 机器级或32位注册也属于已有安装，不能仅因当前用户默认位置为空就覆盖它。
  const script = `$ErrorActionPreference='Stop'; $paths=@('${registryPaths.join("','")}'); $entries=@(foreach($path in $paths){if(Test-Path -LiteralPath $path){$entry=Get-ItemProperty -LiteralPath $path; @{key=$path;version=$entry.DisplayVersion;uninstall=$entry.UninstallString}}}); ConvertTo-Json -InputObject $entries -Compress`
  const { stdout } = await execute(
    powershell,
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { windowsHide: true },
  )
  const entries = z
    .array(z.object({ key: z.string(), version: z.string(), uninstall: z.string() }))
    .parse(JSON.parse(stdout))
  assert.ok(
    entries.length <= 1 && entries.every((entry) => entry.key === registryPath),
    '发现其他位置的验证安装，拒绝接管或覆盖',
  )
  return entries[0] ?? null
}

/** 无注册但仍活着的验证进程也不能接管；权限/查询异常直接失败。 */
export const assertValidationProcessAbsent = async (): Promise<void> => {
  const { stdout } = await execute(
    powershell,
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      "$ErrorActionPreference='Stop'; @(Get-CimInstance Win32_Process -Filter \"Name='WeftPilotValidation.exe'\").Count",
    ],
    { windowsHide: true },
  )
  assert.equal(stdout.trim(), '0', '发现运行中的验证应用，拒绝接管或覆盖')
}

/** 仅驱动本轮合成目录内的独立身份安装器；不运行注册表里返回的任意命令。 */
export const runValidationInstaller = async (input: {
  executable: string
  action: 'install' | 'uninstall'
  directory: string
  fixtureDirectory: string
}): Promise<number> => {
  const root = await realpath(input.fixtureDirectory)
  const target =
    input.action === 'uninstall' ? await realpath(input.directory) : resolve(input.directory)
  const local = relative(root, target)
  assert.ok(local && !local.startsWith('..') && !isAbsolute(local))
  try {
    // 只对本测试子进程运行固定脚本，不修改机器或用户的PowerShell执行策略。
    await execute(
      powershell,
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        resolve('tests/helpers/validation-installer.ps1'),
        '-Executable',
        input.executable,
        '-Action',
        input.action,
        '-InstallDirectory',
        target,
      ],
      { windowsHide: true, timeout: 90000, maxBuffer: 65536 },
    )
    return 0
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'number'
    )
      return error.code
    throw error
  }
}
