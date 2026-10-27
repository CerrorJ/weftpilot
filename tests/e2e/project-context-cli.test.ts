import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  createFixture,
  launch,
  configure,
  snapshot,
  createTask,
  waitForSnapshot,
  quit,
} from './workflow-helpers'
import { confirmPreflight } from './preflight-helpers'

test(
  '真实 CLI 从固定项目上下文读取随机目标和描述，执行成功仍待人工验收',
  { timeout: 240000, skip: process.env.WEFTPILOT_REAL_PROJECT_CONTEXT !== '1' },
  async () => {
    const fixture = await createFixture()
    const application = await launch(fixture.data)
    try {
      const page = await configure(application, fixture.repository, { activate: true })
      const project = (await snapshot(page)).projects[0]!
      const goal = randomUUID()
      const description = randomUUID()
      await page.evaluate(
        async ({ project, goal, description }) =>
          window.weftpilot!.workflow.configureProject({
            key: crypto.randomUUID(),
            input: {
              projectId: project.id,
              expectedVersion: project.version,
              name: project.name,
              goal,
              description,
              defaultTeamId: null,
            },
          }),
        { project, goal, description },
      )
      await createTask(
        page,
        'In this isolated working directory write project-context.txt containing the exact project goal UUID followed by a newline, then the exact project description UUID followed by a newline. Read those values from the fixed project context in this prompt. Do not guess. Only write this file; do not use network, install software, scan the repository, access other directories, commit or push. Finish immediately.',
        '固定项目上下文实测',
        'project-context.txt contains exactly the two UUID values from the fixed project context, in order, with a newline after each.',
      )
      await page.getByRole('button', { name: '开始真实执行' }).click()
      await confirmPreflight(page)
      const terminal = await waitForSnapshot({
        page,
        timeout: 150000,
        predicate: (state) =>
          state.runs.some(
            (run) =>
              run.purpose !== 'role_trial' &&
              ['confirmed_ended', 'uncertain'].includes(run.processState),
          ),
      })
      const run = terminal.runs.find((item) => item.purpose !== 'role_trial')!
      assert.equal(run.status, 'succeeded')
      assert.equal(run.processState, 'confirmed_ended')
      assert.equal(run.projectContextSnapshot?.projectVersion, 2)
      assert.equal(run.projectContextSnapshot?.goal, goal)
      assert.equal(run.projectContextSnapshot?.description, description)
      assert.equal(
        await readFile(join(run.workDirectory, 'project-context.txt'), 'utf8'),
        `${goal}\n${description}\n`,
      )
      assert.equal(terminal.tasks.find((item) => item.id === run.taskId)?.status, 'in_review')
      assert.equal(terminal.acceptances.length, 0)
      const oldRun = JSON.stringify(run)
      await page.evaluate(
        async (project) =>
          window.weftpilot!.workflow.configureProject({
            key: crypto.randomUUID(),
            input: {
              projectId: project.id,
              expectedVersion: 2,
              name: project.name,
              goal: '后续更新',
              description: '',
              defaultTeamId: null,
            },
          }),
        project,
      )
      assert.equal(
        JSON.stringify((await snapshot(page)).runs.find((item) => item.id === run.id)),
        oldRun,
      )
      await page.locator(`[data-run-id="${run.id}"] button`).first().click()
      const history = page.getByRole('dialog', { name: '执行记录快照', exact: true })
      const context = history.locator('.run-project-context')
      await context.locator('summary').click()
      await context.getByText(goal, { exact: true }).waitFor()
      await context.getByText(description, { exact: true }).waitFor()
      assert.equal(await context.innerText().then((text) => text.includes('后续更新')), false)
    } finally {
      await quit(application)
      await fixture.cleanup()
    }
  },
)
