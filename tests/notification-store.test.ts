import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import type { PathLike } from 'node:fs'
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import { join, dirname, basename } from 'node:path'
import { tmpdir } from 'node:os'
import { NotificationStore } from '../apps/desktop/main/notification-store'
import { defaultNotificationPreferences } from '../packages/system-bridge/notification-contract'

const usingStore = async (action: (store: NotificationStore, path: string) => Promise<void>) => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'weftpilot-notifications-')))
  const parent = dirname(directory)
  try {
    await action(new NotificationStore(directory), join(directory, 'notification-preferences.json'))
  } finally {
    assert.equal(await realpath(directory), directory)
    assert.equal(dirname(directory), parent)
    assert.ok(basename(directory).startsWith('weftpilot-notifications-'))
    await rm(directory, { recursive: true })
  }
}

test('偏好原子保存/重启读回/CAS拒绝，损坏配置不被保存覆盖', async () =>
  usingStore(async (store, path) => {
    assert.deepEqual(store.read(), defaultNotificationPreferences)
    const next = store.save({
      expectedVersion: 0,
      enabled: true,
      human: false,
      review: true,
      failure: true,
    })
    assert.equal(next.version, 1)
    assert.deepEqual(new NotificationStore(dirname(path)).read(), next)
    assert.throws(
      () => store.save({ ...next, expectedVersion: 0 }),
      /NOTIFICATION_PREFERENCES_CONFLICT/,
    )
    fs.writeFileSync(path, '{invalid preferences')
    assert.throws(() => store.read(), /NOTIFICATION_PREFERENCES_UNAVAILABLE/)
    assert.throws(
      () =>
        store.save({
          expectedVersion: 1,
          enabled: false,
          human: false,
          review: false,
          failure: false,
        }),
      /NOTIFICATION_PREFERENCES_UNAVAILABLE/,
    )
    assert.equal(fs.readFileSync(path, 'utf8'), '{invalid preferences')
  }))

test('受控文件替换拒绝：已刷盘的临时偏好不覆盖旧版本，清理后可显式恢复保存', async (context) =>
  usingStore(async (store, path) => {
    const first = store.save({
      expectedVersion: 0,
      enabled: false,
      human: true,
      review: true,
      failure: true,
    })
    const before = fs.readFileSync(path)
    const rename = fs.renameSync
    context.mock.method(fs, 'renameSync', (source: PathLike, target: PathLike) => {
      if (String(target) === path) throw new Error('controlled replacement denied')
      rename(source, target)
    })
    syncBuiltinESMExports()
    try {
      assert.throws(
        () =>
          store.save({
            expectedVersion: 1,
            enabled: true,
            human: true,
            review: true,
            failure: true,
          }),
        /NOTIFICATION_PREFERENCES_UNAVAILABLE/,
      )
      assert.deepEqual(fs.readFileSync(path), before)
      assert.deepEqual(store.read(), first)
      assert.deepEqual(fs.readdirSync(dirname(path)), ['notification-preferences.json'])
    } finally {
      context.mock.restoreAll()
      syncBuiltinESMExports()
    }
    assert.equal(
      store.save({ expectedVersion: 1, enabled: true, human: true, review: true, failure: true })
        .version,
      2,
    )
  }))
