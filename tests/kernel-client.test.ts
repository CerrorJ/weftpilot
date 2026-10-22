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
