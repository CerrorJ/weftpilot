import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { initialRoleDraft } from '../apps/desktop/renderer/role-draft'
import { roleFeishuSubmission } from '../apps/desktop/renderer/role-feishu-submission'

test('未启用绑定的普通角色编辑保留false，只有明确勾选连接许可才提交true', () => {
  const saved: RoleVersion = {
    id: randomUUID(),
    version: 1,
    name: '绑定未启用',
    responsibility: '保留许可意图',
    cli: 'codex',
    model: '',
    permission: 'read-only',
    skills: [],
    createdAt: new Date().toISOString(),
    feishuBinding: {
      id: randomUUID(),
      version: 1,
      enabled: false,
      appId: 'cli_0123456789abcdef',
      tenantKey: 'synthetic',
      ownerOpenId: 'ou_owner',
      chatId: 'oc_test',
      credentialRef: `feishu-${randomUUID()}`,
      updatedAt: new Date().toISOString(),
    },
  }
  const draft = initialRoleDraft(saved)
  assert.equal(draft.feishuMode, 'existing')
  assert.equal(draft.feishuEnabled, false)
  const form = new FormData()
  for (const [key, value] of Object.entries({
    feishuMode: 'existing',
    feishuAppId: draft.feishuAppId,
    feishuTenantKey: draft.feishuTenantKey,
    feishuOwnerOpenId: draft.feishuOwnerOpenId,
    feishuChatId: draft.feishuChatId,
  }))
    form.set(key, value)
  const original = roleFeishuSubmission(form, saved)
  assert.equal(original.feishu?.enabled, false)
  assert.equal(original.feishu?.credentialRef, saved.feishuBinding!.credentialRef)
  form.set('feishuEnabled', 'on')
  assert.equal(roleFeishuSubmission(form, saved).feishu?.enabled, true)
  form.delete('feishuEnabled')
  assert.equal(roleFeishuSubmission(form, saved).feishu?.enabled, false)
})
