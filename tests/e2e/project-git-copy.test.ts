import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'
import { test, type TestContext } from 'node:test'
import type { ElectronApplication } from 'playwright'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'
import { navigate } from './navigation-helpers'

const git = (repository: string, args: string[]) =>
  execFileSync('git', args, {
    cwd: repository,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
const clipboardIs = (application: ElectronApplication, expected: string) =>
  application.evaluate(
    async ({ clipboard }, text) => (await clipboard.readText()) === text,
    expected,
  )
const clearOwnedClipboard = (application: ElectronApplication, values: string[]) =>
  application.evaluate(async ({ clipboard }, expected) => {
    if (expected.includes(await clipboard.readText())) await clipboard.clear()
  }, values)

const indexDigest = async (repository: string) => {
  try {
    return createHash('sha256')
      .update(await readFile(join(repository, '.git/index')))
      .digest('hex')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null
    throw error
  }
}

/** 本机权限不可用须显式跳过成功路径；CI要求原生成功，不能借此把缺少能力变绿。 */
const requireClipboard = async (
  context: TestContext,
  application: ElectronApplication,
  probe: string,
) => {
  await application.firstWindow()
  const available = await application.evaluate(async ({ clipboard }, text) => {
    try {
      await clipboard.writeText(text)
      return (await clipboard.readText()) === text
    } catch {
      return false
    }
  }, probe)
  if (available) return true
  if (process.env.CI === 'true' || process.env.WEFTPILOT_REQUIRE_NATIVE_CLIPBOARD === '1')
    throw new Error('NATIVE_CLIPBOARD_UNAVAILABLE: required real clipboard write/read failed')
  await quit(application)
  context.skip('NATIVE_CLIPBOARD_UNAVAILABLE：系统写入/读回受限，真实成功路径未验；CI不得跳过')
  return false
}

test(
  '真实Git地址复制：内核脱敏/系统读回、地址变化拒绝、严格IPC及无origin不伪造地址',
  { timeout: 60000 },
  async (context) => {
    const fixture = await createFixture()
    const raw =
      'https://synthetic-user:synthetic-secret@example.invalid/repository.git?token=synthetic-secret#synthetic-secret'
    const address = 'https://example.invalid/repository.git'
    const changed = 'https://example.invalid/changed.git'
    git(fixture.repository, ['remote', 'add', 'origin', raw])
    const indexBefore = await indexDigest(fixture.repository)
    const application = await launch(fixture.data)
    const probe = `WEFTPILOT_COPY_PREFLIGHT_${randomUUID()}`
    try {
      if (!(await requireClipboard(context, application, probe))) return
      const page = await configure(application, fixture.repository)
      const before = await snapshot(page)
      await navigate(page, '项目管理')
      await page.locator('.project-card-main').click()
      await page.getByText('工作区干净', { exact: true }).waitFor()
      const copy = page.getByRole('button', { name: '复制 Git 地址', exact: true })
      assert.equal(before.projects[0]?.gitUrl, address)
      assert.equal(JSON.stringify(before).includes('synthetic-secret'), false)
      await copy.click()
      await page.getByRole('status').filter({ hasText: 'Git 地址已复制' }).waitFor()
      assert.equal(await clipboardIs(application, address), true)
      assert.equal(git(fixture.repository, ['config', '--get', 'remote.origin.url']), raw)
      await mkdir('.tmp/evidence', { recursive: true })
      await copy.scrollIntoViewIfNeeded()
      await page.screenshot({ path: '.tmp/evidence/project-git-copy-zh-light.png' })
      git(fixture.repository, ['remote', 'set-url', 'origin', changed])
      await copy.click()
      await page.getByRole('alert').filter({ hasText: 'Git 地址已变化' }).waitFor()
      assert.equal(await page.getByText('Git 地址已复制', { exact: true }).count(), 0)
      assert.equal(await clipboardIs(application, address), true)
      await page.getByRole('button', { name: '重新检查仓库', exact: true }).click()
      await page.locator('.project-git-address').getByText(changed, { exact: true }).waitFor()
      await copy.click()
      await page.getByRole('status').filter({ hasText: 'Git 地址已复制' }).waitFor()
      assert.equal(await clipboardIs(application, changed), true)
      const rejected = await page.evaluate(async (projectId) => {
        try {
          await window.weftpilot!.workflow.copyProjectGitAddress({
            projectId,
            projectVersion: 1,
            gitUrl: 'arbitrary',
            path: '/forbidden',
          } as never)
          return false
        } catch (error) {
          return error instanceof Error && error.message.includes('INPUT_INVALID')
        }
      }, before.projects[0]!.id)
      assert.equal(rejected, true)
      assert.equal(await clipboardIs(application, changed), true)
      git(fixture.repository, ['remote', 'remove', 'origin'])
      await page.getByRole('button', { name: '重新检查仓库', exact: true }).click()
      await page.getByText('本地仓库（未配置 origin）', { exact: true }).waitFor()
      assert.equal(await copy.count(), 0)
      assert.deepEqual(await snapshot(page), before)
      const indexAfter = await indexDigest(fixture.repository)
      assert.equal(indexAfter, indexBefore)
      await clearOwnedClipboard(application, [address, changed])
      await quit(application)
    } finally {
      await clearOwnedClipboard(application, [probe, address, changed]).catch(() => undefined)
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

test(
  '真实复制失败与迟到回执：旧项目不污染新项目，英文深色/Unicode地址及键盘操作',
  { timeout: 60000 },
  async (context) => {
    const first = await createFixture()
    const second = await createFixture()
    const addressA = 'https://example.invalid/a.git'
    const addressB = 'git@example.invalid:团队/仓库.git'
    git(first.repository, ['remote', 'add', 'origin', addressA])
    git(second.repository, ['remote', 'add', 'origin', addressB])
    const application = await launch(first.data)
    const probe = `WEFTPILOT_COPY_PREFLIGHT_${randomUUID()}`
    try {
      if (!(await requireClipboard(context, application, probe))) return
      const page = await configure(application, first.repository)
      const projectA = (await snapshot(page)).projects[0]!
      await navigate(page, '项目管理')
      await application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, second.repository)
      await page.getByRole('button', { name: '新建项目', exact: true }).click()
      const creation = page.getByRole('dialog', { name: '新建项目', exact: true })
      await creation.getByLabel('项目名称', { exact: true }).fill('复制目标乙')
      await creation.getByRole('button', { name: '选择仓库并添加', exact: true }).click()
      await creation.waitFor({ state: 'detached' })
      const before = await snapshot(page)
      const projectB = before.projects.find((project) => project.id !== projectA.id)!
      await page.locator(`[data-project-id="${projectA.id}"] .project-card-main`).click()
      await page.getByText('工作区干净', { exact: true }).waitFor()
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 860 })
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
      const copy = page.getByRole('button', { name: 'Copy Git address', exact: true })
      await copy.focus()
      await page.keyboard.press('Enter')
      await page.getByRole('status').filter({ hasText: 'Git address copied' }).waitFor()
      assert.equal(await clipboardIs(application, addressA), true)
      await clipboardFailure(application, true)
      await copy.click()
      await page.getByRole('alert').filter({ hasText: 'Copy could not be confirmed' }).waitFor()
      assert.equal(await page.getByText('Git address copied', { exact: true }).count(), 0)
      assert.equal(await clipboardIs(application, addressA), true)
      await copy.scrollIntoViewIfNeeded()
      await mkdir('.tmp/evidence', { recursive: true })
      await page.screenshot({ path: '.tmp/evidence/project-git-copy-en-dark-narrow.png' })
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await clipboardFailure(application, false)
      await holdReceipt(application, projectA.id)
      await copy.click()
      await waitReceipt(application)
      await page.getByRole('button', { name: 'Back to projects', exact: true }).click()
      await page.locator(`[data-project-id="${projectB.id}"] .project-card-main`).click()
      await page.getByText('Clean working tree', { exact: true }).waitFor()
      await releaseReceipt(application)
      await snapshot(page)
      assert.equal(await page.getByText('Git address copied', { exact: true }).count(), 0)
      await copy.click()
      await page.getByRole('status').filter({ hasText: 'Git address copied' }).waitFor()
      assert.equal(await clipboardIs(application, addressB), true)
      assert.deepEqual(await snapshot(page), before)
      assert.equal(git(first.repository, ['config', '--get', 'remote.origin.url']), addressA)
      assert.equal(git(second.repository, ['config', '--get', 'remote.origin.url']), addressB)
      await clearOwnedClipboard(application, [addressA, addressB])
      await quit(application)
    } finally {
      await clipboardFailure(application, false).catch(() => undefined)
      await releaseReceipt(application).catch(() => undefined)
      await clearOwnedClipboard(application, [probe, addressA, addressB]).catch(() => undefined)
      await application.close().catch(() => undefined)
      await first.cleanup()
      await second.cleanup()
    }
  },
)

test(
  '受控系统写入拒绝的真实界面：中英文/明暗、脱敏、过期地址和非法IPC均不伪报成功',
  { timeout: 60000 },
  async () => {
    const fixture = await createFixture()
    const raw =
      'https://synthetic-user:synthetic-secret@example.invalid/repository.git?token=synthetic-secret'
    git(fixture.repository, ['remote', 'add', 'origin', raw])
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const before = await snapshot(page)
      await navigate(page, '项目管理')
      await page.locator('.project-card-main').click()
      await page.getByText('工作区干净', { exact: true }).waitFor()
      assert.equal(before.projects[0]?.gitUrl, 'https://example.invalid/repository.git')
      assert.equal(JSON.stringify(before).includes('synthetic-secret'), false)
      await clipboardFailure(application, true)
      await page.getByRole('button', { name: '复制 Git 地址', exact: true }).focus()
      await page.keyboard.press('Enter')
      await page.getByRole('alert').filter({ hasText: '未能确认复制' }).waitFor()
      assert.equal(await page.getByText('Git 地址已复制', { exact: true }).count(), 0)
      await mkdir('.tmp/evidence', { recursive: true })
      await page.locator('.project-git-address').scrollIntoViewIfNeeded()
      await page.screenshot({ path: '.tmp/evidence/project-git-copy-unavailable-zh-light.png' })
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      await page.locator('.appearance-settings summary').click()
      await page.setViewportSize({ width: 700, height: 860 })
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
      await page.getByRole('alert').filter({ hasText: 'Copy could not be confirmed' }).waitFor()
      await page.locator('.project-git-address').scrollIntoViewIfNeeded()
      await page.screenshot({ path: '.tmp/evidence/project-git-copy-unavailable-en-dark.png' })
      assert.equal(
        await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth),
        true,
      )
      await clipboardFailure(application, false)
      git(fixture.repository, [
        'remote',
        'set-url',
        'origin',
        'https://example.invalid/changed.git',
      ])
      await page.getByRole('button', { name: 'Copy Git address', exact: true }).click()
      await page.getByRole('alert').filter({ hasText: 'The Git address changed' }).waitFor()
      const invalid = await page.evaluate(async (projectId) => {
        try {
          await window.weftpilot!.workflow.copyProjectGitAddress({
            projectId,
            projectVersion: 1,
            gitUrl: 'arbitrary',
            path: '/forbidden',
          } as never)
          return false
        } catch (error) {
          return error instanceof Error && error.message.includes('INPUT_INVALID')
        }
      }, before.projects[0]!.id)
      assert.equal(invalid, true)
      assert.deepEqual(await snapshot(page), before)
      assert.equal(
        git(fixture.repository, ['config', '--get', 'remote.origin.url']),
        'https://example.invalid/changed.git',
      )
      git(fixture.repository, ['remote', 'set-url', 'origin', 'https://[invalid'])
      await page.getByRole('button', { name: 'Check repository again', exact: true }).click()
      await page.getByText('Git address unavailable', { exact: true }).waitFor()
      assert.equal(
        await page.getByRole('button', { name: 'Copy Git address', exact: true }).count(),
        0,
      )
      assert.deepEqual(await snapshot(page), before)
      await quit(application)
    } finally {
      await clipboardFailure(application, false).catch(() => undefined)
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)

const clipboardFailure = (application: ElectronApplication, enabled: boolean) =>
  application.evaluate(({ clipboard }, fail) => {
    const state = globalThis as typeof globalThis & {
      __copyOriginalWrite?: typeof clipboard.writeText
    }
    if (fail) {
      state.__copyOriginalWrite = clipboard.writeText
      clipboard.writeText = {
        writeText() {
          throw new Error('SYNTHETIC_CLIPBOARD_DENIED')
        },
      }.writeText
    } else if (state.__copyOriginalWrite) {
      clipboard.writeText = state.__copyOriginalWrite
      delete state.__copyOriginalWrite
    }
  }, enabled)

type Handler = (event: unknown, input: unknown) => Promise<unknown>
type Gate = { hit: boolean; release: () => void; original: Handler }
const holdReceipt = (application: ElectronApplication, projectId: string) =>
  application.evaluate(({ ipcMain }, id) => {
    const state = globalThis as typeof globalThis & { __copyGate?: Gate }
    const channel = 'workflow:copyProjectGitAddress'
    const handlers = (ipcMain as unknown as { _invokeHandlers: Map<string, Handler> })
      ._invokeHandlers
    const original = handlers.get(channel)
    if (!original) throw new Error('COPY_HANDLER_REQUIRED')
    let release!: () => void
    const waiting = new Promise<void>((resolve) => {
      release = resolve
    })
    const gate = { hit: false, release, original }
    state.__copyGate = gate
    ipcMain.removeHandler(channel)
    ipcMain.handle(channel, async (event, input: unknown) => {
      const result = await original(event, input)
      if ((input as { projectId: string }).projectId === id && !gate.hit) {
        gate.hit = true
        await waiting
      }
      return result
    })
  }, projectId)
const releaseReceipt = (application: ElectronApplication) =>
  application.evaluate(({ ipcMain }) => {
    const state = globalThis as typeof globalThis & { __copyGate?: Gate }
    if (!state.__copyGate) return
    state.__copyGate.release()
    ipcMain.removeHandler('workflow:copyProjectGitAddress')
    ipcMain.handle('workflow:copyProjectGitAddress', state.__copyGate.original)
    delete state.__copyGate
  })
const waitReceipt = async (application: ElectronApplication) => {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    const hit = await application.evaluate(
      () => (globalThis as typeof globalThis & { __copyGate?: Gate }).__copyGate?.hit,
    )
    if (hit) return
    await pause(25)
  }
  throw new Error('REAL_COPY_RECEIPT_TIMEOUT')
}
