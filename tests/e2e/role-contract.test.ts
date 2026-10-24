import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFixture, launch, configure, snapshot, quit } from './workflow-helpers'

test(
  '实际锁定内核协议边界：新增角色字段经命名IPC往返，旧客户端继承、不可变标识和试运行守卫',
  { timeout: 45000 },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository)
      const original = (await snapshot(page)).roles[0]!
      await page.evaluate(
        async (role) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id: role.id,
              expectedVersion: role.version,
              name: role.name,
              responsibility: role.responsibility,
              cli: role.cli,
              model: role.model,
              permission: role.permission,
              slug: role.slug!,
              inputRequirements: '已确认输入',
              deliveryRequirements: '版本化交付',
              maxConcurrency: 2,
            },
          }),
        original,
      )
      const configured = (await snapshot(page)).roles.find(
        (role) => role.id === original.id && role.version === 2,
      )!
      assert.equal(configured.inputRequirements, '已确认输入')
      assert.equal(configured.deliveryRequirements, '版本化交付')
      assert.equal(configured.maxConcurrency, 2)
      await page.evaluate(
        async (role) =>
          window.weftpilot!.workflow.saveRole({
            key: crypto.randomUUID(),
            input: {
              id: role.id,
              expectedVersion: role.version,
              name: '省略新增字段的编辑',
              responsibility: role.responsibility,
              cli: role.cli,
              model: role.model,
              permission: role.permission,
            },
          }),
        configured,
      )
      const state = await snapshot(page)
      const latest = state.roles.find((role) => role.id === original.id && role.version === 3)!
      assert.equal(latest.slug, original.slug)
      assert.equal(latest.inputRequirements, configured.inputRequirements)
      assert.equal(latest.deliveryRequirements, configured.deliveryRequirements)
      assert.equal(latest.maxConcurrency, 2)
      assert.deepEqual(
        state.roles.find((role) => role.id === original.id && role.version === 1),
        original,
      )
      await assert.rejects(
        page.evaluate(
          async (role) =>
            window.weftpilot!.workflow.saveRole({
              key: crypto.randomUUID(),
              input: {
                id: role.id,
                expectedVersion: role.version,
                name: role.name,
                responsibility: role.responsibility,
                cli: role.cli,
                model: role.model,
                permission: role.permission,
                slug: 'changed-identifier',
              },
            }),
          latest,
        ),
        /ROLE_IDENTIFIER_IMMUTABLE/,
      )
      const readiness = state.roleReadiness.find((item) => item.roleId === original.id)!
      await assert.rejects(
        page.evaluate(
          async ({ role, readiness }) =>
            window.weftpilot!.workflow.setRoleEnabled({
              key: crypto.randomUUID(),
              input: {
                roleId: role.id,
                expectedRoleVersion: role.version,
                expectedReadinessVersion: readiness.version,
                enabled: true,
              },
            }),
          { role: latest, readiness },
        ),
        /ROLE_NOT_READY/,
      )
      assert.deepEqual((await snapshot(page)).roles, state.roles)
      assert.equal((await snapshot(page)).runs.length, 0)
      await quit(application)
    } finally {
      await application.close().catch(() => undefined)
      await fixture.cleanup()
    }
  },
)
