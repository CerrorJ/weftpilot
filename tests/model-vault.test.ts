import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { ModelVault, type SecretEncryption } from '../apps/desktop/main/model-vault'
import { prepareModelSubmission } from '../apps/desktop/main/model-submission'
import { hostCredentials } from '../apps/desktop/main/host-credentials'

// 端口测试只验证文件发布/绑定/协议；真实 safeStorage 由 Electron 端到端验证。
const encryption = (): SecretEncryption => {
  const key = randomBytes(32)
  return {
    available: () => true,
    encrypt: (value) => {
      const iv = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', key, iv)
      const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
      return Buffer.concat([iv, cipher.getAuthTag(), data])
    },
    decrypt: (value) => {
      const cipher = createDecipheriv('aes-256-gcm', key, value.subarray(0, 12))
      cipher.setAuthTag(value.subarray(12, 28))
      return Buffer.concat([cipher.update(value.subarray(28)), cipher.final()]).toString('utf8')
    },
  }
}
const binding = () => ({
  reference: `model-${randomUUID()}`,
  provider: 'openai-compatible' as const,
  baseUrl: 'https://provider.invalid/v1',
})

test('密文引用并发发布只接受同内容，不能覆盖或将旧密钥交给新地址', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-vault-'))
  const vault = new ModelVault(directory, encryption())
  const ref = binding()
  try {
    await Promise.all([vault.save(ref, 'synthetic-secret'), vault.save(ref, 'synthetic-secret')])
    assert.equal(await vault.read(ref), 'synthetic-secret')
    await assert.rejects(vault.save(ref, 'new-secret'), /IDEMPOTENCY_CONFLICT/)
    await assert.rejects(
      vault.read({ ...ref, baseUrl: 'https://other.invalid/' }),
      /MODEL_CREDENTIAL_REQUIRED/,
    )
    assert.equal((await readdir(directory)).length, 1)
    const data = await readFile(join(directory, `${ref.reference}.bin`))
    assert.equal(data.includes(Buffer.from('synthetic-secret')), false)
    await assert.rejects(vault.read({ ...ref, reference: '../../outside' }))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('模型提交移除明文、同命令重试复用引用、轮换新引用不改写旧值', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-vault-'))
  const vault = new ModelVault(directory, encryption())
  const key = randomUUID()
  const input = {
    expectedVersion: 0,
    name: '合成接口',
    cli: 'codex',
    provider: 'openai-compatible',
    model: 'test-model',
    baseUrl: 'https://provider.invalid/v1',
    credentialRef: null,
    reasoningEffort: '',
    secret: 'synthetic-secret',
  }
  try {
    const command = await prepareModelSubmission({ input, key, vault })
    assert.equal('secret' in command, false)
    assert.equal(command.credentialRef, `model-${key}`)
    assert.deepEqual(await prepareModelSubmission({ input, key, vault }), command)
    const rotated = await prepareModelSubmission({
      input: { ...input, secret: 'new-secret' },
      key: randomUUID(),
      vault,
    })
    assert.notEqual(rotated.credentialRef, command.credentialRef)
    const ref = { ...binding(), reference: command.credentialRef! }
    assert.equal(await vault.read(ref), 'synthetic-secret')
    await assert.rejects(
      prepareModelSubmission({
        input: {
          ...input,
          secret: '',
          credentialRef: command.credentialRef,
          baseUrl: 'https://other.invalid/',
        },
        key: randomUUID(),
        vault,
      }),
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('不可用的系统加密拒绝写入，宿主只回复合法私有凭据请求', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-vault-'))
  const port = encryption()
  const vault = new ModelVault(directory, { ...port, available: () => false })
  try {
    await assert.rejects(
      vault.save(binding(), 'synthetic-secret'),
      /CREDENTIAL_STORAGE_UNAVAILABLE/,
    )
    assert.equal((await readdir(directory)).length, 0)
    const replies: unknown[] = []
    const handler = hostCredentials({ vault, send: (message) => replies.push(message) })
    handler({ kind: 'host.credential.request', binding: binding() })
    const id = randomUUID()
    handler({ protocolVersion: 1, kind: 'host.credential.request', id, binding: binding() })
    await new Promise((resolve) => setImmediate(resolve))
    assert.deepEqual(replies, [
      { protocolVersion: 1, kind: 'host.credential.result', id, value: null },
    ])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
