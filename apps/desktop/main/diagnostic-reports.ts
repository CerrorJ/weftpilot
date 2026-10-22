import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync, lstatSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { dialog, type BrowserWindow } from 'electron'
import type { KernelClient } from '../../../packages/kernel-client/client'
import {
  diagnosticExportInputSchema,
  diagnosticReportSchema,
  type DiagnosticReport,
} from '../../../packages/kernel-client/diagnostics-contract'

interface DiagnosticOptions {
  client(): KernelClient
  window(): BrowserWindow | undefined
  root: string
  credentialsAvailable(): boolean
  desktop: DiagnosticReport['desktop']
}

/** 报告在宿主生成、预览后凭短期票据导出；不接受页面提交报告正文或任意路径。 */
export class DiagnosticReports {
  private readonly previews = new Map<string, { report: DiagnosticReport; expiresAt: number }>()
  private choosing = false

  constructor(private readonly options: DiagnosticOptions) {}

  async query() {
    const client = this.options.client()
    const handshake = await client.handshake()
    const lock = JSON.parse(readFileSync(join(this.options.root, 'kernel-lock.json'), 'utf8')) as {
      sourceCommit: string
      sha256: string
    }
    if (handshake.sourceCommit !== lock.sourceCommit) throw new Error('内核源提交与锁定版本不一致')
    const report = diagnosticReportSchema.parse({
      handshake,
      artifactSha256: lock.sha256,
      credentialsAvailable: this.options.credentialsAvailable(),
      desktop: this.options.desktop,
      environment: await client.request('kernel.diagnostics'),
    })
    const ticket = randomUUID()
    for (const [key, value] of this.previews)
      if (value.expiresAt < Date.now()) this.previews.delete(key)
    if (this.previews.size >= 8) this.previews.delete(this.previews.keys().next().value!)
    this.previews.set(ticket, { report, expiresAt: Date.now() + 15 * 60_000 })
    return { ...report, ticket }
  }

  async export(raw: unknown) {
    const parsed = diagnosticExportInputSchema.safeParse(raw)
    if (!parsed.success) throw new Error('VALIDATION_FAILED')
    const input = parsed.data
    const preview = this.previews.get(input.ticket)
    if (!preview || preview.expiresAt < Date.now()) throw new Error('DIAGNOSTIC_PREVIEW_STALE')
    if (this.choosing) throw new Error('MAINTENANCE_BUSY')
    this.choosing = true
    try {
      const selected = await this.choose(input.language)
      if (selected.canceled || !selected.filePath) return { canceled: true as const }
      writeReport(selected.filePath, preview.report)
      return { canceled: false as const, fileName: basename(selected.filePath) }
    } finally {
      this.choosing = false
    }
  }

  private choose(language: 'zh-CN' | 'en') {
    const options = {
      title: language === 'en' ? 'Export previewed diagnostic report' : '导出已预览的诊断报告',
      defaultPath: `WeftPilot-diagnostics-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    }
    const window = this.options.window()
    return window ? dialog.showSaveDialog(window, options) : dialog.showSaveDialog(options)
  }
}

const writeReport = (target: string, report: DiagnosticReport): void => {
  const temporary = join(dirname(target), `.weftpilot-diagnostic-${randomUUID()}.tmp`)
  try {
    if (existsSync(target) && lstatSync(target).isSymbolicLink())
      throw new Error('DIAGNOSTIC_EXPORT_FAILED')
    writeFileSync(temporary, JSON.stringify(diagnosticReportSchema.parse(report), null, 2) + '\n', {
      flag: 'wx',
      mode: 0o600,
      flush: true,
    })
    renameSync(temporary, target)
  } catch {
    if (existsSync(temporary)) unlinkSync(temporary)
    throw new Error('DIAGNOSTIC_EXPORT_FAILED')
  }
}
