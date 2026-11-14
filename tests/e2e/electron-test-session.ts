import type { ElectronApplication } from 'playwright'
import { observeLifecycle } from './lifecycle-evidence'
import { releaseInspectorOnQuit } from './inspector-teardown'

/** 仅测试入口装配调试传输；启动期配置失败也必须尝试正常关闭并保留失败。 */
export const prepareElectronTest = async (application: ElectronApplication) => {
  try {
    if (process.platform === 'win32' && process.env.WEFTPILOT_E2E_RELEASE_INSPECTOR !== '0')
      await releaseInspectorOnQuit(application)
    if (process.env.WEFTPILOT_E2E_LIFECYCLE === '1') await observeLifecycle(application)
    return application
  } catch (error) {
    console.error('WEFTPILOT_E2E_LIFECYCLE_SETUP_FAILED')
    await application.close().catch(() => {
      console.error('WEFTPILOT_E2E_LIFECYCLE_SETUP_CLEANUP_FAILED')
    })
    throw error
  }
}
