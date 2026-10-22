import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

test('CI 缺少专用凭据时明确阻塞且不泄露环境内容', () => {
  assert.throws(
    () =>
      execFileSync(process.execPath, ['build/ci-kernel-pin.mjs'], {
        env: { ...process.env, AGENT_TEAM_READ_TOKEN: '' },
        stdio: 'pipe',
      }),
    (error: unknown) => {
      const failure = error as { stderr: Buffer }
      assert.match(failure.stderr.toString(), /缺少 AGENT_TEAM_READ_TOKEN/)
      return true
    },
  )
})

test('CI 输出仅有固定提交，不包含凭据', () => {
  const directory = mkdtempSync(join(tmpdir(), 'weftpilot-ci-'))
  const output = join(directory, 'github-output')
  try {
    execFileSync(process.execPath, ['build/ci-kernel-pin.mjs'], {
      env: {
        ...process.env,
        AGENT_TEAM_READ_TOKEN: 'non-secret-test-placeholder',
        GITHUB_OUTPUT: output,
      },
      stdio: 'pipe',
    })
    const pin = JSON.parse(readFileSync('config/kernel-lock.json', 'utf8')) as {
      sourceCommit: string
    }
    assert.equal(readFileSync(output, 'utf8'), `commit=${pin.sourceCommit}\n`)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
