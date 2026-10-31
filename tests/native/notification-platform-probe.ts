import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import type { Page } from 'playwright'
import { z } from 'zod'
import { createFixture, launch, quit, snapshot } from '../e2e/workflow-helpers'
import { notificationStatus } from '../e2e/notification-helpers'
import { observeNotificationDiagnostics } from './notification-diagnostics'

const mode = process.env.WEFTPILOT_PROBE_MODE
assert.ok(mode === 'unsigned' || mode === 'adhoc', 'PROBE_MODE_REQUIRED')
assert.ok(process.env.WEFTPILOT_PACKAGED_EXE, 'OWN_PACKAGE_REQUIRED')
const requireShown = process.env.WEFTPILOT_PROBE_REQUIRE_SHOWN === '1'
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const kernel = z
  .object({
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .parse(JSON.parse(await readFile('config/kernel-lock.json', 'utf8')))

/** 原生对照只收集固定通知回执，不替换OS API、不创建Run或读取其他应用的数据。 */
const feedback = async (page: Page) => {
  await page.evaluate(() => window.weftpilot?.notifications.test())
  const deadline = Date.now() + 15000
  let status = await notificationStatus(page)
  while (status.last?.kind !== 'test' || status.last.state === 'requested') {
    if (Date.now() >= deadline) break
    await new Promise((resolve) => setTimeout(resolve, 150))
    status = await notificationStatus(page)
  }
  return status
}

const emptyBusinessState = async (page: Page) => {
  const state = await snapshot(page)
  const counts = {
    projects: state.projects.length,
    roles: state.roles.length,
    tasks: state.tasks.length,
    runs: state.runs.length,
    deliveries: state.deliveries.length,
    acceptances: state.acceptances.length,
    humanRequests: state.humanRequests.length,
  }
  assert.ok(
    Object.values(counts).every((count) => count === 0),
    'OWN_EMPTY_FIXTURE_REQUIRED',
  )
  return counts
}

const runProbe = async () => {
  const fixture = await createFixture()
  const application = await launch(fixture.data)
  let diagnostics: ReturnType<typeof observeNotificationDiagnostics>
  try {
    diagnostics = observeNotificationDiagnostics(application)
    const page = await application.firstWindow()
    const before = await emptyBusinessState(page)
    const status = await feedback(page)
    assert.deepEqual(await emptyBusinessState(page), before)
    const packaged = await application.evaluate(({ app }) => app.isPackaged)
    await mkdir('.tmp/evidence', { recursive: true })
    await writeFile(
      `.tmp/evidence/notification-platform-${mode}.json`,
      JSON.stringify(
        {
          mode,
          platform: process.platform,
          sourceCommit,
          kernelCommit: kernel.sourceCommit,
          kernelSha256: kernel.sha256,
          packaged,
          status,
          unchangedBusinessCounts: before,
          ...(diagnostics ? { diagnostics: diagnostics.snapshot() } : {}),
        },
        null,
        2,
      ),
    )
    assert.equal(packaged, true, 'REAL_PACKAGE_REQUIRED')
    console.log(`NATIVE_PROBE ${mode} ${process.platform} ${status.last?.state ?? 'none'}`)
    if (requireShown) assert.equal(status.last?.state, 'shown', 'NATIVE_NOTIFICATION_NOT_SHOWN')
  } finally {
    // 对照失败也经过产品正常退出守卫；状态未知时不强杀或清空现场。
    await quit(application)
    diagnostics?.close()
    await fixture.cleanup()
  }
}

await runProbe()
