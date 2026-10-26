import { projectInspectionSchema } from '@weftpilot/agent-team-kernel/protocol'
import {
  projectGitCopyInputSchema,
  isCopyableGitAddress,
  type ProjectGitCopyInput,
  type ProjectGitCopyReceipt,
} from '../../../packages/kernel-client/project-clipboard'
import { parseInput } from './input-validation'

interface ClipboardPorts {
  inspect(projectId: string): Promise<unknown>
  write(value: string): void | Promise<void>
  read(): string | Promise<string>
}

/** Git查询仍由内核负责；系统写入串行，新请求不得被迟到的旧复制覆盖。 */
export class ProjectClipboard {
  private generation = 0
  private writing: Promise<void> = Promise.resolve()

  constructor(private readonly ports: ClipboardPorts) {}

  async copy(raw: unknown, assertSender: () => void): Promise<ProjectGitCopyReceipt> {
    assertSender()
    const input = parseInput(projectGitCopyInputSchema, raw)
    const generation = ++this.generation
    const result = projectInspectionSchema.safeParse(await this.ports.inspect(input.projectId))
    if (!result.success || result.data.projectId !== input.projectId)
      throw new Error('COMMAND_RESULT_UNCERTAIN')
    const report = result.data
    if (!isCopyableGitAddress(report.gitUrl)) throw new Error('PROJECT_GIT_COPY_UNAVAILABLE')
    if (report.projectVersion !== input.projectVersion || report.gitUrl !== input.gitUrl)
      throw new Error('PROJECT_GIT_COPY_STALE')
    const assertCurrent = () => {
      assertSender()
      if (generation !== this.generation) throw new Error('PROJECT_GIT_COPY_SUPERSEDED')
    }
    const operation = this.writing.then(() => this.commit(input, assertCurrent))
    // 失败仅释放互斥尾；本次调用仍传播拒绝，不把下一次显式操作变成自动重试。
    this.writing = operation.then(
      () => undefined,
      () => undefined,
    )
    return operation
  }

  private async commit(
    input: ProjectGitCopyInput,
    assertCurrent: () => void,
  ): Promise<ProjectGitCopyReceipt> {
    assertCurrent()
    try {
      await this.ports.write(input.gitUrl)
      // 只在私有主进程比较刚写入的文本，不向页面返回其他剪贴板内容。
      if ((await this.ports.read()) !== input.gitUrl) throw new Error('CLIPBOARD_MISMATCH')
    } catch {
      throw new Error('PROJECT_GIT_COPY_FAILED')
    }
    assertCurrent()
    return { ...input, copied: true }
  }
}
