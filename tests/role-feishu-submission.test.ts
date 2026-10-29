import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { FeishuVault } from '../apps/desktop/main/feishu-vault'
import { prepareRoleSubmission } from '../apps/desktop/main/role-submission'
import { secretEncryption } from './helpers/secret-encryption'
import { roleDraftSchema, initialRoleDraft } from '../apps/desktop/renderer/role-draft'
import { roleFeishuSubmission } from '../apps/desktop/renderer/role-feishu-submission'

const role = () => ({
  expectedVersion: 0,
  name: '合成渠道配置',
  responsibility: '仅验证密文桥接，未连接真实租户',
  cli: 'codex',
  model: '',
  permission: 'read-only',
})

const identity = () => ({
  appId: 'cli_0123456789abcdef',
  tenantKey: 'synthetic-tenant',
  ownerOpenId: 'ou_owner',
  chatId: 'oc_synthetic',
  credentialRef: '',
  enabled: true,
})

test('角色提交在宿主剥离Secret并原子密文发布，重放不可覆盖，旧引用严格绑定AppID', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-role-channel-'))
  const vault = new FeishuVault(directory, secretEncryption())
  const key = randomUUID()
  const secret = `synthetic-only-${randomUUID()}`
  const input = { ...role(), feishu: identity(), feishuSecret: secret }
  try {
    const command = await prepareRoleSubmission({ key, input, vault })
    assert.equal(command.feishu?.credentialRef, `feishu-${key}`)
    assert.equal('feishuSecret' in command, false)
    assert.equal(JSON.stringify(command).includes(secret), false)
    assert.deepEqual(await prepareRoleSubmission({ key, input, vault }), command)
    const file = join(directory, `feishu-${key}.bin`)
    const bytes = await readFile(file)
    assert.equal(bytes.includes(Buffer.from(secret)), false)
    await assert.rejects(
      prepareRoleSubmission({ key, input: { ...input, feishuSecret: 'changed-secret' }, vault }),
      /IDEMPOTENCY_CONFLICT/,
    )
    assert.deepEqual(await readFile(file), bytes)
    const reused = await prepareRoleSubmission({
      key: randomUUID(),
      input: { ...role(), feishu: command.feishu },
      vault,
    })
    assert.deepEqual(reused.feishu, command.feishu)
    await assert.rejects(
      prepareRoleSubmission({
        key: randomUUID(),
        input: {
          ...role(),
          feishu: { ...command.feishu, appId: 'cli_fedcba9876543210' },
        },
        vault,
      }),
      /FEISHU_APP_SECRET_REQUIRED/,
    )
    assert.deepEqual(await readdir(directory), [`feishu-${key}.bin`])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('角色渠道输入先严格校验，none/旧客户端不依赖密钥；草稿拒绝Secret且提交不修剪身份', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weftpilot-role-channel-invalid-'))
  const encryption = secretEncryption()
  const vault = new FeishuVault(directory, { ...encryption, available: () => false })
  try {
    const plain = await prepareRoleSubmission({ key: randomUUID(), input: role(), vault })
    assert.equal(Object.hasOwn(plain, 'feishu'), false)
    const none = await prepareRoleSubmission({
      key: randomUUID(),
      input: { ...role(), feishu: null },
      vault,
    })
    assert.equal(none.feishu, null)
    for (const fields of [
      { feishu: null, feishuSecret: 'secret' },
      { feishu: { ...identity(), secret: 'nested-secret' }, feishuSecret: 'secret' },
      { feishu: { ...identity(), appId: ' cli_0123456789abcdef' }, feishuSecret: 'secret' },
      { feishu: { ...identity(), credentialRef: '../outside' } },
    ])
      await assert.rejects(
        prepareRoleSubmission({ key: randomUUID(), input: { ...role(), ...fields }, vault }),
        /VALIDATION_FAILED/,
      )
    assert.equal((await readdir(directory)).length, 0)
    const draft = initialRoleDraft(undefined)
    assert.equal(draft.feishuMode, 'none')
    assert.equal(
      roleDraftSchema.safeParse({ ...draft, feishuSecret: 'never-store' }).success,
      false,
    )
    assert.equal(
      roleDraftSchema.safeParse({ ...draft, credentialRef: 'never-store' }).success,
      false,
    )
    const form = new FormData()
    form.set('feishuMode', 'existing')
    form.set('feishuAppId', ' cli_0123456789abcdef')
    form.set('feishuOwnerOpenId', 'ou_owner ')
    form.set('roleFeishuSecret', 'synthetic-secret')
    const submission = roleFeishuSubmission(form, undefined)
    assert.equal(submission.feishu?.appId, ' cli_0123456789abcdef')
    assert.equal(submission.feishu?.ownerOpenId, 'ou_owner ')
    form.set('feishuMode', 'none')
    assert.deepEqual(roleFeishuSubmission(form, undefined), { feishu: null })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
