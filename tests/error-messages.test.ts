import assert from 'node:assert/strict'
import { test } from 'node:test'
import { translateError } from '../apps/desktop/renderer/error-messages'

test('稳定错误码在裸码、Electron包装及未知前缀中均能翻译，不把包装串当作产品错误', () => {
  const direct = translateError('FEISHU_NOT_CONFIGURED', true)
  assert.match(direct!, /^FEISHU_NOT_CONFIGURED: Configure/)
  assert.equal(
    translateError('Error invoking remote method: Error: FEISHU_NOT_CONFIGURED', true),
    direct,
  )
  assert.equal(translateError('UNKNOWN_PREFIX: FEISHU_NOT_CONFIGURED', true), direct)
  assert.equal(translateError('普通业务内容', true), undefined)
})
