import { utilityProcess, type UtilityProcess } from 'electron'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { KernelClient } from '../../../packages/kernel-client/client'

interface KernelLock {
  sourceCommit: string
  kernelVersion: string
  files: Record<string, string>
}

/** 启动前核验产物，结束时同时等待协议确认和 OS 进程退出。 */
export class KernelHost {
  readonly client: KernelClient
  private readonly child: UtilityProcess
  private readonly exited: Promise<void>
  private exitCode: number | undefined

  constructor(root: string, dataDirectory: string) {
    const lock = JSON.parse(readFileSync(join(root, 'kernel-lock.json'), 'utf8')) as KernelLock
    for (const [file, digest] of Object.entries(lock.files)) {
      const actual = createHash('sha256')
        .update(readFileSync(join(root, 'kernel', file)))
        .digest('hex')
      if (actual !== digest) throw new Error(`内核文件校验失败：${file}`)
    }
    this.child = utilityProcess.fork(join(root, 'kernel/embedded-entry.js'), [dataDirectory], {
      serviceName: 'WeftPilot Agent-Team',
      stdio: 'pipe',
    })
    this.client = new KernelClient({
      send: (message) => this.child.postMessage(message),
      onMessage: (listener) => {
        this.child.on('message', listener)
      },
    })
    this.exited = new Promise((resolve) => {
      this.child.once('exit', (code) => {
        this.exitCode = code
        this.client.disconnect()
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (this.exitCode !== undefined) {
      if (this.exitCode !== 0) throw new Error('内核异常退出，需要确认运行状态')
      return
    }
    await this.client.request('kernel.shutdown')
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([
        this.exited,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('内核仍未退出，不能确认安全停止')), 10_000)
        }),
      ])
    } finally {
      clearTimeout(timer)
    }
    if (this.exitCode !== 0) throw new Error('内核异常退出，不能确认安全停止')
  }
}
