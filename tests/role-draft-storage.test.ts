import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RoleDraftStorage } from '../apps/desktop/renderer/role-draft-storage'

const controlledStorage = () => {
  const values = new Map<string, string>()
  let allowed = true
  const port = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (!allowed) throw new Error('quota')
      values.set(key, value)
    },
    removeItem: (key: string) => {
      if (!allowed) throw new Error('blocked')
      values.delete(key)
    },
    get length() {
      return values.size
    },
    key: (index: number) => [...values.keys()][index] ?? null,
  }
  return {
    values,
    port,
    refuse: () => {
      allowed = false
    },
    permit: () => {
      allowed = true
    },
  }
}

test('草稿写入配额拒绝时读内存新稿；删除失败墓碑不复活旧稿，恢复后显式操作收口', () => {
  const storage = controlledStorage()
  const drafts = new RoleDraftStorage(() => storage.port)
  drafts.write('draft', 'old')
  storage.refuse()
  drafts.write('draft', 'new')
  assert.equal(storage.values.get('draft'), 'old')
  assert.equal(drafts.read('draft'), 'new')
  assert.equal(drafts.volatile(), true)
  drafts.remove('draft')
  assert.equal(drafts.read('draft'), null)
  assert.deepEqual(drafts.keys(), [])
  storage.permit()
  assert.equal(drafts.read('draft'), null)
  drafts.remove('draft')
  assert.equal(drafts.volatile(), false)
  assert.equal(storage.values.has('draft'), false)
})

test('会话存储整个不可访问时保留本窗口已读/新写草稿和索引，不冒充重载持久化', () => {
  const storage = controlledStorage()
  let denied = false
  const drafts = new RoleDraftStorage(() => {
    if (denied) throw new Error('blocked')
    return storage.port
  })
  drafts.write('existing', 'known')
  denied = true
  assert.equal(drafts.read('existing'), 'known')
  drafts.write('new', 'unsaved')
  assert.deepEqual(drafts.keys().sort(), ['existing', 'new'])
  assert.equal(drafts.read('new'), 'unsaved')
  assert.equal(drafts.volatile(), true)
  denied = false
  drafts.write('new', 'saved')
  assert.equal(drafts.volatile(), false)
  assert.equal(new RoleDraftStorage(() => storage.port).read('new'), 'saved')
})
