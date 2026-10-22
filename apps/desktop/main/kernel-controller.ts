import { randomUUID } from 'node:crypto'
import type { KernelClient } from '../../../packages/kernel-client/client'
import { DataLocation, type RestoreOperation } from './data-location'

export interface HostedKernel {
  client: KernelClient
  stop(): Promise<void>
}
interface ControllerOptions {
  userData: string
  sourceCommit: string
  createHost: (directory: string) => HostedKernel
  location?: Pick<DataLocation, 'slot' | 'directory' | 'activate' | 'record' | 'operation'>
}

/** 数据位置是宿主配置，业务库仍只由工具进程中的Agent-Team访问。 */
export class KernelController {
  private readonly location: NonNullable<ControllerOptions['location']>
  private current: HostedKernel
  private switching: Promise<{ restored: true }> | undefined

  constructor(private readonly options: ControllerOptions) {
    this.location = options.location ?? new DataLocation(options.userData)
    this.current = options.createHost(this.location.directory())
  }

  get client(): KernelClient {
    if (this.switching) throw new Error('MAINTENANCE_BUSY')
    return this.current.client
  }

  async stop(): Promise<void> {
    if (this.switching) await this.switching.catch(() => undefined)
    await this.current.stop()
  }

  status() {
    const slot = this.location.slot()
    const operation = this.location.operation()
    return {
      slot,
      operation:
        operation && operation.candidateSlot === slot
          ? { ...operation, phase: 'activated' as const }
          : operation,
    }
  }

  /** 位置切换持有同一个Promise互斥门；完全退出排在切换后，不能用模态对话框阻塞握手。 */
  restore(backupDirectory: string, expectedManifestDigest: string): Promise<{ restored: true }> {
    if (this.switching) return Promise.reject(new Error('MAINTENANCE_BUSY'))
    this.switching = this.performRestore(backupDirectory, expectedManifestDigest).finally(() => {
      this.switching = undefined
    })
    return this.switching
  }

  private async performRestore(
    backupDirectory: string,
    expectedManifestDigest: string,
  ): Promise<{ restored: true }> {
    const operation: RestoreOperation = {
      id: randomUUID(),
      previousSlot: this.location.slot(),
      candidateSlot: randomUUID(),
      phase: 'preparing',
      updatedAt: new Date().toISOString(),
    }
    let stopped = false
    let preparation: 'none' | 'requested' | 'prepared' = 'none'
    let candidate: HostedKernel | undefined
    try {
      this.location.record(operation)
      const targetDirectory = this.location.directory(operation.candidateSlot)
      preparation = 'requested'
      await this.current.client.maintenance({
        method: 'workspace.restore',
        backupDirectory,
        targetDirectory,
        expectedManifestDigest,
      })
      preparation = 'prepared'
      this.record(operation, 'prepared')
      await this.current.stop()
      stopped = true
      this.record(operation, 'old_stopped')
      candidate = this.options.createHost(targetDirectory)
      await this.verify(candidate)
      this.location.activate(operation.candidateSlot)
      this.current = candidate
      this.recordBestEffort(operation, 'activated')
      return { restored: true }
    } catch (error) {
      await this.compensate({ operation, stopped, candidate, error, preparation })
      if (stopped) throw new Error('BACKUP_ACTIVATION_FAILED')
      if (preparation === 'none') throw new Error('DATA_LOCATION_INVALID')
      throw error
    }
  }

  private async compensate(input: {
    operation: RestoreOperation
    stopped: boolean
    candidate: HostedKernel | undefined
    error: unknown
    preparation: 'none' | 'requested' | 'prepared'
  }): Promise<void> {
    if (!input.stopped) {
      const knownRejection =
        input.preparation === 'none' ||
        (input.preparation === 'requested' &&
          input.error instanceof Error &&
          /^(BACKUP_[A-Z_]+|VALIDATION_FAILED|INTERNAL_ERROR):/.test(input.error.message))
      this.recordBestEffort(input.operation, knownRejection ? 'rolled_back' : 'uncertain')
      if (!knownRejection) throw new Error('BACKUP_ACTIVATION_UNCERTAIN')
      return
    }
    try {
      await input.candidate?.stop()
      const previous = this.options.createHost(
        this.location.directory(input.operation.previousSlot),
      )
      await this.verify(previous)
      this.current = previous
      this.recordBestEffort(input.operation, 'rolled_back')
    } catch {
      this.recordBestEffort(input.operation, 'uncertain')
      throw new Error('BACKUP_ACTIVATION_UNCERTAIN')
    }
  }

  private async verify(host: HostedKernel): Promise<void> {
    const handshake = await host.client.handshake()
    if (handshake.sourceCommit !== this.options.sourceCommit)
      throw new Error('DATA_LOCATION_INVALID')
  }

  private record(operation: RestoreOperation, phase: RestoreOperation['phase']): void {
    this.location.record({ ...operation, phase, updatedAt: new Date().toISOString() })
  }

  private recordBestEffort(operation: RestoreOperation, phase: RestoreOperation['phase']): void {
    // 激活指针是权威运行配置；辅助诊断记录写入失败不能撤销已生效的位置。
    try {
      this.record(operation, phase)
    } catch {
      /* 重启诊断根据实际位置指针核对候选ID，不能自动重放恢复。 */
    }
  }
}
