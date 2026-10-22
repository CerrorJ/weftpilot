import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FeishuVault } from '../apps/desktop/main/feishu-vault'
import { prepareFeishuSubmission } from '../apps/desktop/main/feishu-submission'
import { hostCredentials } from '../apps/desktop/main/host-credentials'
import { ModelVault } from '../apps/desktop/main/model-vault'
import { secretEncryption } from './helpers/secret-encryption'

test('飞书密文原子不可覆盖，绑定AppID，非法引用或加密不可用均拒绝', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-feishu-vault-'))
  const encryption = secretEncryption()
  const vault = new FeishuVault(directory, encryption)
  const binding = { reference: `feishu-${randomUUID()}`, appId: 'cli_0123456789abcdef' }
  try {
    await Promise.all([
      vault.save(binding, 'synthetic-secret'),
      vault.save(binding, 'synthetic-secret'),
    ])
    assert.equal(await vault.read(binding), 'synthetic-secret')
    await assert.rejects(vault.save(binding, 'replacement'), /IDEMPOTENCY_CONFLICT/)
    await assert.rejects(
      vault.read({ ...binding, appId: 'cli_abcdef0123456789' }),
      /FEISHU_APP_SECRET_REQUIRED/,
    )
    await assert.rejects(vault.read({ ...binding, reference: '../../outside' }))
    assert.deepEqual(await readdir(directory), [`${binding.reference}.bin`])
    assert.equal(
      (await readFile(join(directory, `${binding.reference}.bin`))).includes(
        Buffer.from('synthetic-secret'),
      ),
      false,
    )
    const unavailable = new FeishuVault(directory, { ...encryption, available: () => false })
    await assert.rejects(
      unavailable.save(binding, 'synthetic-secret'),
      /CREDENTIAL_STORAGE_UNAVAILABLE/,
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('飞书提交剥离明文，相同命令保留引用；私有通道核对应用绑定，不向页面提供读接口', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-feishu-submission-'))
  const encryption = secretEncryption()
  const vault = new FeishuVault(directory, encryption)
  const key = randomUUID()
  const input = {
    expectedVersion: 0,
    appId: 'cli_0123456789abcdef',
    tenantKey: 'synthetic-tenant',
    ownerOpenId: 'ou_owner',
    chatId: 'oc_test',
    enabled: false,
    secret: 'synthetic-secret',
  }
  try {
    const command = await prepareFeishuSubmission({ input, key, vault })
    await assert.rejects(
      prepareFeishuSubmission({
        input: { ...input, appId: 'cli_invalid_extra_underscore' },
        key,
        vault,
      }),
      (error: unknown) => error instanceof Error && error.message === 'VALIDATION_FAILED',
    )
    assert.equal('secret' in command, false)
    assert.equal(command.credentialRef, `feishu-${key}`)
    assert.deepEqual(await prepareFeishuSubmission({ input, key, vault }), command)
    await assert.rejects(
      prepareFeishuSubmission({ input: { ...input, secret: 'changed' }, key, vault }),
      /IDEMPOTENCY_CONFLICT/,
    )
    const receive = (appId: string) =>
      new Promise<unknown>((resolve) => {
        const handler = hostCredentials({
          vault: new ModelVault(join(directory, 'models'), encryption),
          feishuVault: vault,
          send: resolve,
        })
        handler({
          protocolVersion: 1,
          kind: 'host.credential.request',
          id: key,
          binding: { reference: command.credentialRef, appId },
        })
      })
    assert.equal(
      ((await receive('cli_0123456789abcdef')) as { value: string }).value,
      'synthetic-secret',
    )
    assert.equal(((await receive('cli_abcdef0123456789')) as { value: unknown }).value, null)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
