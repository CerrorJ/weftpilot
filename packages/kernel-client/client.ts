import { randomUUID } from 'node:crypto'
import {
  eventSchema,
  handshakeSchema,
  responseSchema,
  type KernelHandshake,
  type KernelRequest,
  type KernelResponse,
  type BusinessCommand,
  type PreflightInput,
  type CliCheckInput,
} from '@weftpilot/agent-team-kernel/protocol'

export interface KernelTransport {
  send(message: KernelRequest): void
  onMessage(listener: (message: unknown) => void): void
  acknowledgeShutdown?(requestId: string): void
}

type MaintenanceMethod = 'workspace.backup' | 'workspace.backup.inspect' | 'workspace.restore'
type MaintenanceInput = {
  [Method in MaintenanceMethod]: Omit<
    Extract<KernelRequest, { method: Method }>,
    'requestId' | 'protocolVersion'
  >
}[MaintenanceMethod]

type RoleFeishuMethod = 'feishu.role.connect' | 'feishu.role.disconnect' | 'feishu.role.status'
type RoleFeishuInput = {
  [Method in RoleFeishuMethod]: Omit<
    Extract<KernelRequest, { method: Method }>,
    'requestId' | 'protocolVersion'
  >
}[RoleFeishuMethod]

interface PendingRequest {
  resolve(value: unknown): void
  reject(reason: Error): void
  timer: ReturnType<typeof setTimeout>
}

/** 仅处理契约与连接；业务结果始终由 Agent-Team 裁决。 */
export class KernelClient {
  private readonly pending = new Map<string, PendingRequest>()
  private disconnected = false

  constructor(private readonly transport: KernelTransport) {
    transport.onMessage((message) => this.receive(message))
  }

  async handshake(): Promise<KernelHandshake> {
    return handshakeSchema.parse(await this.request('kernel.handshake'))
  }

  /** 先验证停机结果，再通知私有传输端退出；仍由宿主另行核对 OS 退出。 */
  async shutdown(): Promise<void> {
    const requestId = randomUUID()
    const result = await this.sendRequest({
      protocolVersion: 1,
      requestId,
      method: 'kernel.shutdown',
      ...(this.transport.acknowledgeShutdown ? { acknowledgeExit: true as const } : {}),
    })
    if (
      typeof result !== 'object' ||
      result === null ||
      !('state' in result) ||
      result.state !== 'stopped'
    )
      throw new Error('内核未确认安全停止')
    this.transport.acknowledgeShutdown?.(requestId)
  }

  request(
    method:
      | 'kernel.handshake'
      | 'kernel.health'
      | 'kernel.diagnostics'
      | 'kernel.shutdown'
      | 'workspace.snapshot'
      | 'feishu.connect'
      | 'feishu.disconnect'
      | 'feishu.status',
  ): Promise<unknown> {
    return this.sendRequest({ protocolVersion: 1, requestId: randomUUID(), method })
  }

  command(command: BusinessCommand, key: string): Promise<unknown> {
    return this.sendRequest({
      protocolVersion: 1,
      requestId: randomUUID(),
      method: 'workspace.command',
      command,
      key,
    })
  }

  preflight(input: PreflightInput): Promise<unknown> {
    return this.sendRequest({
      protocolVersion: 1,
      requestId: randomUUID(),
      method: 'workspace.preflight',
      input,
    })
  }

  checkCli(input: CliCheckInput): Promise<unknown> {
    return this.sendRequest({
      protocolVersion: 1,
      requestId: randomUUID(),
      method: 'kernel.cliCheck',
      input,
    })
  }

  detail(
    method: 'workspace.delivery' | 'workspace.run' | 'workspace.activity',
    id: string,
  ): Promise<unknown> {
    return this.sendRequest({ protocolVersion: 1, requestId: randomUUID(), method, id })
  }

  inspectProject(projectId: string): Promise<unknown> {
    return this.sendRequest({
      protocolVersion: 1,
      requestId: randomUUID(),
      method: 'workspace.project.inspect',
      input: { projectId },
    })
  }

  maintenance(input: MaintenanceInput): Promise<unknown> {
    return this.sendRequest({ ...input, protocolVersion: 1, requestId: randomUUID() }, 180_000)
  }

  roleFeishu(input: RoleFeishuInput): Promise<unknown> {
    return this.sendRequest({ ...input, protocolVersion: 1, requestId: randomUUID() })
  }

  private sendRequest(request: KernelRequest, timeoutMs = 30_000): Promise<unknown> {
    if (this.disconnected) return Promise.reject(new Error('内核连接已中断，请重启纬舟后重新检测'))
    if (this.pending.size >= 100) return Promise.reject(new Error('内核请求过多，请稍后重试'))
    const requestId = request.requestId
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId)
        reject(new Error('内核响应超时，执行状态待确认'))
      }, timeoutMs)
      this.pending.set(requestId, { resolve, reject, timer })
      try {
        this.transport.send(request)
      } catch (error) {
        this.finish(requestId, error instanceof Error ? error : new Error('发送失败'))
      }
    })
  }

  disconnect(): void {
    this.disconnected = true
    for (const id of this.pending.keys()) this.finish(id, new Error('内核连接已中断，状态待确认'))
  }

  private receive(input: unknown): void {
    if (typeof input !== 'object' || input === null || !('kind' in input)) return
    if (input.kind === 'event' && 'event' in input) {
      eventSchema.safeParse(input.event)
      return
    }
    if (input.kind !== 'response' || !('response' in input)) return
    const parsed = responseSchema.safeParse(input.response)
    if (!parsed.success) {
      this.disconnect()
      return
    }
    this.complete(parsed.data)
  }

  private complete(response: KernelResponse): void {
    if (!response.requestId) {
      this.disconnect()
      return
    }
    if (response.status === 'rejected') {
      this.finish(
        response.requestId,
        new Error(`${response.error.code}: ${response.error.message}`),
      )
    } else this.finish(response.requestId, undefined, response.result)
  }

  private finish(id: string, error?: Error, result?: unknown): void {
    const pending = this.pending.get(id)
    if (!pending) return
    clearTimeout(pending.timer)
    this.pending.delete(id)
    if (error) pending.reject(error)
    else pending.resolve(result)
  }
}
