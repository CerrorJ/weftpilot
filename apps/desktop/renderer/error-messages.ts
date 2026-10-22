import { productErrors } from './product-errors'
import { humanErrors } from './human-errors'
import { feishuErrors } from './feishu-errors'
const messages: Record<string, [string, string]> = {
  ...productErrors,
  ...humanErrors,
  ...feishuErrors,
  GIT_ROOT_REQUIRED: [
    '请选择有效 Git 仓库的根目录',
    'Select the root directory of a valid Git repository.',
  ],
  GIT_UNAVAILABLE: [
    '未找到 Git，请安装并重启应用',
    'Git was not found. Install Git and restart the app.',
  ],
  GIT_BRANCH_INVALID: [
    '默认分支无效或没有提交，请检查分支名称',
    'The default branch is invalid or has no commits. Check the branch name.',
  ],
  GIT_DIRTY: [
    '仓库存在未提交改动，请先保留并处理已有文件',
    'The repository has uncommitted changes. Preserve and resolve them before starting.',
  ],
  GIT_BASELINE_CHANGED: [
    '排队期间基准已改变，请创建新执行',
    'The baseline changed while queued. Create a new run.',
  ],
  STATE_UNCERTAIN: [
    '旧执行状态待确认，禁止自动重跑',
    'The previous process state is uncertain. Automatic retries are blocked.',
  ],
  VERSION_CONFLICT: ['数据已变化，请刷新后操作', 'Data changed. Refresh before trying again.'],
  IDEMPOTENCY_CONFLICT: [
    '同一命令键对应了不同内容',
    'The same command key was reused with different content.',
  ],
  VALIDATION_FAILED: ['输入格式或协议版本不兼容', 'Input or protocol version is incompatible.'],
  NOT_FOUND: ['对象不存在', 'The requested object does not exist.'],
  RUN_ACTIVE: ['当前执行尚未结束', 'The current run has not ended.'],
  TASK_NOT_READY: [
    '任务尚不可执行，请先处理当前交付',
    'Review the current delivery before starting again.',
  ],
  STALE_RUN: ['请选择最新一次执行', 'Select the latest run.'],
  STALE_DELIVERY: ['旧交付不能改变当前执行', 'An old delivery cannot change the current run.'],
  DELIVERY_NOT_PENDING: [
    '交付已经处理或尚未就绪',
    'The delivery is already reviewed or is not ready.',
  ],
  REASON_REQUIRED: ['退回必须填写原因', 'A reason is required to return a delivery.'],
  CAPABILITY_UNSUPPORTED: [
    '当前配置包含尚不支持的能力',
    'This configuration includes an unsupported capability.',
  ],
  KERNEL_STOPPED: ['内核正在停止或已停止', 'The kernel is stopping or has stopped.'],
  INTERNAL_ERROR: [
    '操作未完成，请查看诊断；不要假定执行成功',
    'The operation did not complete. Check diagnostics before retrying.',
  ],
}

/** 协议错误按稳定代码翻译，避免把 Electron 包装通道或原始异常作为产品提示。 */
export const translateError = (text: string, english: boolean): string | undefined => {
  const code = text.match(/\b[A-Z][A-Z_]+\b/g)?.find((candidate) => messages[candidate])
  const pair = code ? messages[code] : undefined
  return pair ? `${code}: ${pair[english ? 1 : 0]}` : undefined
}
