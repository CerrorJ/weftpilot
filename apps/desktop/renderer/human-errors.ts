export const humanErrors: Record<string, [string, string]> = {
  HUMAN_REQUEST_EXPIRED: [
    '人工请求已经过期，不能继续放行',
    'This request has expired. Execution cannot continue.',
  ],
  HUMAN_REQUEST_NOT_PENDING: [
    '人工请求已经处理或撤销',
    'This request was already resolved or cancelled.',
  ],
  HUMAN_DECISION_INVALID: [
    '决定与本次请求类型或题目不匹配',
    'The decision does not match this request, or exceeds its answer limit.',
  ],
  HUMAN_SESSION_REQUIRED: [
    '缺少可靠续接会话，不能继续本次执行',
    'A reliable CLI session is required to continue this run.',
  ],
  STALE_HUMAN_REQUEST: [
    '旧人工请求不能影响当前执行',
    'An older request cannot affect the current run.',
  ],
}
