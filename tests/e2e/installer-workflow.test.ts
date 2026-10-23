import assert from 'node:assert/strict'
import { test } from 'node:test'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { readFile, readdir, access, mkdir, writeFile, realpath, rename } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { _electron as electron, type ElectronApplication } from 'playwright'
import { createFixture, configure, snapshot, quit } from './workflow-helpers'
import {
  validationArtifact,
  validationRegistration,
  runValidationInstaller,
  validationProfileDirectory,
  assertValidationProcessAbsent,
} from '../helpers/installer-runtime'

test(
  'Windows真实NSIS：隔离安装、运行中升级/卸载拒绝、退出后升级保留业务/密文/语言主题、卸载保留数据',
  {
    timeout: 240000,
    skip: process.platform !== 'win32' || process.env.WEFTPILOT_REAL_INSTALLER !== '1',
  },
  async () => {
    assert.equal(await validationRegistration(), null, '发现已有独立验收安装，拒绝接管或覆盖')
    await assertValidationProcessAbsent()
    const first = await validationArtifact(process.env.WEFTPILOT_INSTALLER_V1_MANIFEST ?? '')
    const second = await validationArtifact(process.env.WEFTPILOT_INSTALLER_V2_MANIFEST ?? '')
    assert.notEqual(first.manifest.version, second.manifest.version)
    const fixture = await createFixture()
    const directory = join(fixture.directory, '安装 # Windows')
    const executablePath = join(directory, 'WeftPilotValidation.exe')
    const data = await validationProfileDirectory()
    await assert.rejects(access(data), { code: 'ENOENT' }, '已有验收profile不能接管或读取')
    await mkdir(data)
    const owner = randomUUID()
    const ownerFile = join(data, '.weftpilot-validation-owner')
    await writeFile(ownerFile, owner, { flag: 'wx', mode: 0o600 })
    await writeFile(
      join(fixture.directory, 'validation-profile-owner.json'),
      JSON.stringify({ owner, data }),
      { flag: 'wx' },
    )
    const environment = Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] =>
          entry[1] !== undefined && !/^WEFTPILOT_TEST_DATA$/i.test(entry[0]),
      ),
    )
    let application: ElectronApplication | undefined
    let passed = false
    const setup = (executable: string, action: 'install' | 'uninstall') =>
      runValidationInstaller({ executable, action, directory, fixtureDirectory: fixture.directory })
    try {
      assert.equal(await setup(first.path, 'install'), 0)
      assert.equal((await validationRegistration())?.version, first.manifest.version)
      application = await electron.launch({
        executablePath,
        args: [],
        env: environment,
      })
      assert.equal(
        await application.evaluate(({ app }) => app.getVersion()),
        first.manifest.version,
      )
      assert.equal(await application.evaluate(({ app }) => app.getPath('userData')), data)
      let page = await configure(application, fixture.repository)
      await page.evaluate(() =>
        window.weftpilot!.workflow.saveModel({
          key: crypto.randomUUID(),
          input: {
            expectedVersion: 0,
            name: 'installer-synthetic-model',
            cli: 'codex',
            provider: 'openai-compatible',
            model: 'synthetic-model',
            baseUrl: 'http://127.0.0.1:9/v1',
            credentialRef: null,
            reasoningEffort: '',
            secret: 'installer-synthetic-secret',
          },
        }),
      )
      const before = await snapshot(page)
      await page.locator('.appearance-settings summary').click()
      await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
      assert.equal(await setup(second.path, 'install'), 32)
      assert.equal(
        await setup(join(directory, 'Uninstall WeftPilotValidation.exe'), 'uninstall'),
        32,
      )
      assert.equal(
        await application.evaluate(({ app }) => app.getVersion()),
        first.manifest.version,
      )
      assert.deepEqual(await snapshot(page), before)
      await quit(application)
      application = undefined
      const encryptedDirectory = join(data, 'credentials/models')
      const encryptedNames = await readdir(encryptedDirectory)
      const encryptedBefore = await readFile(join(encryptedDirectory, encryptedNames[0]!))
      assert.equal(encryptedBefore.includes(Buffer.from('installer-synthetic-secret')), false)
      assert.equal(await setup(second.path, 'install'), 0)
      assert.equal((await validationRegistration())?.version, second.manifest.version)
      application = await electron.launch({
        executablePath,
        args: [],
        env: environment,
      })
      page = await application.firstWindow()
      assert.equal(
        await application.evaluate(({ app }) => app.getVersion()),
        second.manifest.version,
      )
      assert.deepEqual(await snapshot(page), before)
      await page.getByRole('button', { name: 'Projects & roles', exact: true }).click()
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      assert.deepEqual(
        await readFile(join(encryptedDirectory, encryptedNames[0]!)),
        encryptedBefore,
      )
      const decrypted = await application.evaluate(
        ({ safeStorage }, bytes) => safeStorage.decryptString(Buffer.from(bytes)),
        [...encryptedBefore],
      )
      assert.equal(JSON.parse(decrypted).secret, 'installer-synthetic-secret')
      await quit(application)
      application = undefined
      const database = new DatabaseSync(join(data, 'kernel/kernel.sqlite'), {
        readOnly: true,
      })
      assert.equal(
        database.prepare('SELECT type FROM events ORDER BY sequence DESC LIMIT 1').get()?.type,
        'kernel.stopped',
      )
      database.close()
      assert.equal(
        await setup(join(directory, 'Uninstall WeftPilotValidation.exe'), 'uninstall'),
        0,
      )
      assert.equal(await validationRegistration(), null)
      await assert.rejects(access(executablePath))
      await access(join(data, 'kernel/kernel.sqlite'))
      assert.deepEqual(
        await readFile(join(encryptedDirectory, encryptedNames[0]!)),
        encryptedBefore,
      )
      await mkdir('.tmp/evidence', { recursive: true })
      await writeFile(
        '.tmp/evidence/m4-installer-native-result.json',
        JSON.stringify(
          {
            first: first.manifest,
            second: second.manifest,
            runningUpgradeExit: 32,
            runningUninstallExit: 32,
            preserved: ['projects', 'roles', 'models', 'encrypted-credential', 'en', 'dark'],
            stopped: true,
            uninstalled: true,
            dataRetained: true,
            defaultUserData: true,
          },
          null,
          2,
        ),
      )
      // 只移动本轮新建、带确切所有权标记的独立profile；保留数据断言在移动之前完成。
      assert.equal(await realpath(data), resolve(data))
      assert.equal(await readFile(ownerFile, 'utf8'), owner)
      await rename(data, fixture.data)
      passed = true
    } finally {
      if (application) await application.close().catch(() => undefined)
      if (passed) await fixture.cleanup()
      else console.warn('保留独立安装器失败现场，不接管未知应用：', fixture.directory)
    }
  },
)
