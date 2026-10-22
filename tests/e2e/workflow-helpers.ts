import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron, type ElectronApplication, type Page } from 'playwright'
import type {} from '../../apps/desktop/renderer/desktop-api'
import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'

export const launch = (data: string) => {
  const executablePath = process.env.WEFTPILOT_PACKAGED_EXE
  return electron.launch({
    ...(executablePath ? { executablePath, args: [] } : { args: ['.'] }),
    env: { ...process.env, WEFTPILOT_TEST_DATA: data },
  })
}

export const quit = async (application: ElectronApplication) => {
  const closed = new Promise<void>((resolve) => application.once('close', resolve))
  await application.evaluate(({ Menu }) => {
    Menu.getApplicationMenu()?.items[0]?.submenu?.items[0]?.click()
  })
  await closed
}

export const snapshot = async (page: Page): Promise<WorkspaceSnapshot> => {
  const state = await page.evaluate(() => window.weftpilot?.workflow.snapshot())
  assert.ok(state)
  return state as WorkspaceSnapshot
}

export const createFixture = async () => {
  const directory = await mkdtemp(join(tmpdir(), '纬舟 workflow '))
  const repository = join(directory, '测试 repository #')
  await mkdir(repository)
  execFileSync('git', ['init', '-b', 'main'], { cwd: repository, stdio: 'ignore' })
  execFileSync(
    'git',
    [
      '-c',
      'user.name=WeftPilot Test',
      '-c',
      'user.email=test@weftpilot.invalid',
      'commit',
      '--allow-empty',
      '-m',
      'baseline',
    ],
    { cwd: repository, stdio: 'ignore' },
  )
  return {
    directory,
    repository,
    data: join(directory, 'app-data'),
    cleanup: () => rm(directory, { recursive: true, force: true }),
  }
}

export const configure = async (application: ElectronApplication, repository: string) => {
  const page = await application.firstWindow()
  // 仅替代系统目录选择；业务创建、协议、数据库、Git 与执行器全部使用真实实现。
  await application.evaluate(({ dialog }, path) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  }, repository)
  await page.getByRole('button', { name: '项目与角色', exact: true }).click()
  await page.getByLabel('项目名称', { exact: true }).fill('合成测试项目')
  await page.getByRole('button', { name: '选择仓库并添加' }).click()
  await page.getByText(repository, { exact: true }).waitFor()
  await page.getByLabel('角色名称', { exact: true }).fill('测试开发者')
  await page
    .getByLabel('职责', { exact: true })
    .fill('仅操作本任务的隔离工作目录；不访问网络或其他目录。')
  await page.getByLabel('工具权限').selectOption('workspace-write')
  await page.getByRole('button', { name: '创建角色', exact: true }).click()
  await page.getByRole('option', { name: '测试开发者 · v1' }).waitFor({ state: 'attached' })
  return page
}

export const createTask = async (page: Page, goal: string) => {
  await page.getByRole('button', { name: '任务与交付', exact: true }).click()
  await page.locator('.task-create summary').click()
  await page.getByLabel('任务名称', { exact: true }).fill('验证真实闭环')
  await page.getByLabel('任务目标', { exact: true }).fill(goal)
  await page
    .getByLabel('验收条件', { exact: true })
    .fill('hello.txt 内容恰好为 WEFTPILOT_M1_OK 和换行，不提交、不推送。')
  await page.getByRole('button', { name: '创建待执行任务' }).click()
  await page.getByRole('button', { name: '开始真实执行' }).waitFor()
}
