import assert from 'node:assert/strict'
import { test } from 'node:test'
import { macOSTestName } from '../apps/desktop/main/test-identity'

test('Mac显式测试身份稳定隔离二进制与数据目录，正式/Windows身份不变且名称不泄漏路径', () => {
  const input = {
    platform: 'darwin' as const,
    testData: '/private/test-data',
    executable: '/private/development/Electron',
  }
  const first = macOSTestName(input)
  assert.match(first!, /^WeftPilot Test [a-f0-9]{20}$/)
  assert.equal(first, macOSTestName(input))
  assert.notEqual(first, macOSTestName({ ...input, executable: '/private/packaged/WeftPilot' }))
  assert.notEqual(first, macOSTestName({ ...input, testData: '/private/another-test' }))
  assert.equal(macOSTestName({ ...input, testData: undefined }), undefined)
  assert.equal(macOSTestName({ ...input, testData: '' }), undefined)
  assert.equal(macOSTestName({ ...input, platform: 'win32' }), undefined)
  assert.equal(macOSTestName({ ...input, platform: 'linux' }), undefined)
  assert.doesNotMatch(first!, /private|test-data|development/)
})
