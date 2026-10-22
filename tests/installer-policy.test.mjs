import assert from 'node:assert/strict'
import { test } from 'node:test'
import { installerConfiguration, installerEnvironment } from '../build/installer-config.mjs'

test('本地安装构建不继承签名/发布/模型/飞书秘密，明确禁用签名发现', () => {
  const environment = installerEnvironment({
    PATH: 'synthetic-path',
    SystemRoot: 'synthetic-system',
    TEMP: 'synthetic-temp',
    CSC_LINK: 'synthetic-signing-secret',
    APPLE_API_KEY: 'synthetic-apple-secret',
    GH_TOKEN: 'synthetic-publishing-secret',
    OPENAI_API_KEY: 'synthetic-model-secret',
    FEISHU_APP_SECRET: 'synthetic-feishu-secret',
    NODE_OPTIONS: '--inspect',
  })
  assert.deepEqual(environment, {
    PATH: 'synthetic-path',
    SystemRoot: 'synthetic-system',
    TEMP: 'synthetic-temp',
    CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  })
})

test('隔离验收安装器使用独立身份；本地包关闭签名公证发布并保留用户数据', () => {
  const production = installerConfiguration({ output: 'out', appDirectory: 'app', icons: 'icons' })
  const validation = installerConfiguration({
    output: 'out',
    appDirectory: 'app',
    icons: 'icons',
    validation: true,
  })
  assert.notEqual(validation.appId, production.appId)
  assert.notEqual(validation.productName, production.productName)
  assert.equal(production.publish, null)
  assert.equal(production.win.signExecutable, false)
  assert.equal(production.mac.identity, null)
  assert.equal(production.mac.notarize, false)
  assert.equal(production.nsis.deleteAppDataOnUninstall, false)
  assert.equal(production.nsis.runAfterFinish, false)
  assert.equal(production.nsis.allowElevation, false)
  assert.equal(production.nsis.perMachine, false)
})
