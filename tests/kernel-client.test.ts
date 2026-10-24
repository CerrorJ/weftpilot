import assert from 'node:assert/strict'
import { test } from 'node:test'
import { KernelClient, type KernelTransport } from '../packages/kernel-client/client'
import type { KernelRequest } from '@weftpilot/agent-team-kernel/protocol'

const transport = () => {
  let listener: (input: unknown) => void = () => undefined
  const sent: KernelRequest[] = []
  const bridge: KernelTransport = {
    send: (message) => {
      sent.push(message)
    },
    onMessage: (next) => {
      listener = next
    },
  }
  return { bridge, sent, receive: (input: unknown) => listener(input) }
}

test('私有协议关联请求，乱序响应仍对应原调用', async () => {
  const channel = transport()
  const client = new KernelClient(channel.bridge)
  const first = client.request('kernel.health')
  const second = client.request('kernel.health')
  const respond = (index: number, value: string) =>
    channel.receive({
      kind: 'response',
      response: {
        protocolVersion: 1,
        requestId: channel.sent[index]?.requestId,
        status: 'completed',
        result: value,
      },
    })
  respond(1, 'second')
  respond(0, 'first')
  assert.equal(await first, 'first')
  assert.equal(await second, 'second')
})

test('不兼容响应关闭连接，挂起请求失败且不自动重发', async () => {
  const channel = transport()
  const client = new KernelClient(channel.bridge)
  const waiting = client.request('kernel.health')
  channel.receive({ kind: 'response', response: { protocolVersion: 2 } })
  await assert.rejects(waiting, /状态待确认/)
  await assert.rejects(client.request('kernel.health'), /连接已中断/)
  assert.equal(channel.sent.length, 1)
})

test('固定CLI检查走独立版本化查询，拒绝结果保持拒绝且不变成业务命令或自动重发', async () => {
  const channel = transport()
  const client = new KernelClient(channel.bridge)
  const checking = client.checkCli({ cli: 'claude', check: 'sign-in' })
  const request = channel.sent[0]
  assert.ok(request && request.method === 'kernel.cliCheck')
  assert.deepEqual(request.input, { cli: 'claude', check: 'sign-in' })
  channel.receive({
    kind: 'response',
    response: {
      protocolVersion: 1,
      requestId: request.requestId,
      status: 'rejected',
      error: { code: 'CLI_CHECK_BUSY', message: 'busy', retryable: false },
    },
  })
  await assert.rejects(checking, /CLI_CHECK_BUSY/)
  assert.equal(channel.sent.length, 1)
})

test('停机收讫绑定请求ID；未收到或被拒绝的停机不能发送ACK', async () => {
  const channel = transport()
  const acknowledgements: string[] = []
  channel.bridge.acknowledgeShutdown = (id) => acknowledgements.push(id)
  const client = new KernelClient(channel.bridge)
  const stopping = client.shutdown()
  const request = channel.sent[0]
  assert.ok(request && request.method === 'kernel.shutdown' && request.acknowledgeExit)
  assert.deepEqual(acknowledgements, [])
  channel.receive({
    kind: 'response',
    response: {
      protocolVersion: 1,
      requestId: request.requestId,
      status: 'completed',
      result: { state: 'stopped' },
    },
  })
  await stopping
  assert.deepEqual(acknowledgements, [request.requestId])
  const second = client.shutdown()
  channel.receive({
    kind: 'response',
    response: {
      protocolVersion: 1,
      requestId: channel.sent[1]?.requestId,
      status: 'rejected',
      error: { code: 'STATE_UNCERTAIN', message: 'uncertain', retryable: false },
    },
  })
  await assert.rejects(second, /STATE_UNCERTAIN/)
  assert.equal(acknowledgements.length, 1)
})
