import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DataLocation } from '../apps/desktop/main/data-location'
import { KernelController, type HostedKernel } from '../apps/desktop/main/kernel-controller'
import { KernelClient } from '../packages/kernel-client/client'
import {
  KERNEL_VERSION,
  DATA_SCHEMA_VERSION,
  type KernelRequest,
} from '@weftpilot/agent-team-kernel/protocol'

const sourceCommit = 'a'.repeat(40)
/** 仅替换进程边界，用于确定性注入握手/停止/原子指针失败；真实工具进程另做E2E。 */
const hostPort = (input: {
  name: string
  sequence: string[]
  wrongCommit?: boolean
  failStop?: boolean
  rejectPrepare?: boolean
  handshakeGate?: Promise<void>
}): HostedKernel => {
  let listener: (value: unknown) => void = () => undefined
  const client = new KernelClient({
    onMessage: (value) => {
      listener = value
    },
    send: (request: KernelRequest) => {
      input.sequence.push(`${input.name}:${request.method}`)
      if (input.rejectPrepare && request.method === 'workspace.restore') {
        queueMicrotask(() =>
          listener({
            kind: 'response',
            response: {
              protocolVersion: 1,
              requestId: request.requestId,
              status: 'rejected',
              error: { code: 'BACKUP_PREVIEW_STALE', message: 'Changed backup', retryable: false },
            },
          }),
        )
        return
      }
      queueMicrotask(async () => {
        if (request.method === 'kernel.handshake') await input.handshakeGate
        listener({
          kind: 'response',
          response: {
            protocolVersion: 1,
            requestId: request.requestId,
            status: 'completed',
            result:
              request.method === 'kernel.handshake'
                ? {
                    kernelVersion: KERNEL_VERSION,
                    protocolVersion: 1,
                    dataSchemaVersion: DATA_SCHEMA_VERSION,
                    sourceCommit: input.wrongCommit ? 'b'.repeat(40) : sourceCommit,
                    capabilities: [],
                    unavailable: [],
                    runtime: {
                      node: process.versions.node,
                      platform: process.platform,
                      arch: process.arch,
                    },
                  }
                : {},
          },
        })
      })
    },
  })
  return {
    client,
    stop: async () => {
      input.sequence.push(`${input.name}:stop`)
      if (input.failStop) throw new Error('synthetic stop uncertain')
    },
  }
}

test('数据位置只允许default/UUID，替换保留有效指针，非法配置不静默回默认库', () => {
  const directory = mkdtempSync(join(tmpdir(), 'weftpilot-location-'))
  try {
    const location = new DataLocation(directory)
    assert.equal(location.slot(), 'default')
    const slot = randomUUID()
    location.activate(slot)
    assert.equal(location.slot(), slot)
    assert.equal(location.directory(), join(directory, 'workspaces', slot))
    location.activate('default')
    assert.equal(location.slot(), 'default')
    assert.throws(() => location.directory('../elsewhere'))
    writeFileSync(join(directory, 'active-kernel.json'), '{broken')
    assert.throws(() => location.slot(), /DATA_LOCATION_INVALID/)
    assert.equal(readFileSync(join(directory, 'active-kernel.json'), 'utf8'), '{broken')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('恢复期间完全退出先等待切换结束，再停止实际生效的新内核，不弹出阻塞恢复的退出对话框', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'weftpilot-restore-quit-'))
  const sequence: string[] = []
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let count = 0
  const controller = new KernelController({
    userData: directory,
    sourceCommit,
    createHost: () => {
      const name = count++ === 0 ? 'old' : 'candidate'
      return hostPort({ name, sequence, ...(name === 'candidate' ? { handshakeGate: gate } : {}) })
    },
  })
  try {
    const restoring = controller.restore('selected-backup', 'c'.repeat(64))
    await new Promise<void>((resolve) => setImmediate(resolve))
    const stopping = controller.stop()
    assert.equal(sequence.includes('candidate:stop'), false)
    release()
    await Promise.all([restoring, stopping])
    assert.ok(sequence.indexOf('candidate:stop') > sequence.indexOf('candidate:kernel.handshake'))
    assert.equal(controller.status().operation?.phase, 'activated')
  } finally {
    release()
    await controller.stop().catch(() => undefined)
    rmSync(directory, { recursive: true, force: true })
  }
})

for (const fault of ['none', 'handshake', 'pointer', 'stop', 'reject'] as const)
  test(`恢复进程边界补偿：${fault}`, async () => {
    const directory = mkdtempSync(join(tmpdir(), 'weftpilot-restore-controller-'))
    mkdirSync(join(directory, 'kernel'))
    const location = new DataLocation(directory)
    const sequence: string[] = []
    let count = 0
    const controller = new KernelController({
      userData: directory,
      sourceCommit,
      location: {
        slot: () => location.slot(),
        directory: (slot) => location.directory(slot),
        operation: () => location.operation(),
        record: (value) => location.record(value),
        activate: (slot) => {
          sequence.push('pointer:activate')
          if (fault === 'pointer') throw new Error('synthetic pointer write failed')
          location.activate(slot)
        },
      },
      createHost: () => {
        const name = ['old', 'candidate', 'rollback'][count++]!
        sequence.push(`${name}:start`)
        assert.equal(
          location.slot(),
          'default',
          'pointer must not change before candidate handshake',
        )
        return hostPort({
          name,
          sequence,
          wrongCommit: fault === 'handshake' && name === 'candidate',
          failStop: fault === 'stop' && name === 'old',
          rejectPrepare: fault === 'reject',
        })
      },
    })
    try {
      if (fault === 'none') {
        assert.deepEqual(await controller.restore('selected-backup', 'c'.repeat(64)), {
          restored: true,
        })
        assert.notEqual(location.slot(), 'default')
        assert.ok(sequence.indexOf('old:stop') < sequence.indexOf('candidate:start'))
        assert.ok(
          sequence.indexOf('candidate:kernel.handshake') < sequence.indexOf('pointer:activate'),
        )
        assert.equal(controller.status().operation?.phase, 'activated')
      } else {
        await assert.rejects(controller.restore('selected-backup', 'c'.repeat(64)))
        assert.equal(location.slot(), 'default')
        assert.equal(
          controller.status().operation?.phase,
          fault === 'stop' ? 'uncertain' : 'rolled_back',
        )
        assert.equal(sequence.includes('rollback:start'), fault !== 'stop' && fault !== 'reject')
        if (fault !== 'stop' && fault !== 'reject') assert.ok(sequence.includes('candidate:stop'))
      }
    } finally {
      await controller.stop().catch(() => undefined)
      rmSync(directory, { recursive: true, force: true })
    }
  })
