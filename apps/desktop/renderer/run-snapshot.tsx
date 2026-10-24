import type { Run, Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { CreateDialog } from './create-dialog'
import { useI18n } from './preferences'
import { runLabel } from './task-status'
import { RunActivity } from './run-activity'
import { RunInputs } from './task-relations'
import { DeliveryReview } from './delivery-review'

interface HistoryContext {
  task: Task
  runs: Run[]
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}

export const RunHistory = ({ task, runs, state, actions }: HistoryContext) => {
  const { t } = useI18n()
  return (
    <section className="run-history" aria-label={t('历次执行')}>
      <h3>
        {t('历次执行')} <span>{runs.length}</span>
      </h3>
      {!runs.length && <p className="muted">{t('尚无执行记录')}</p>}
      {runs.map((run) => (
        <div className="run-history-row" key={run.id} data-run-id={run.id}>
          <RunSnapshotButton task={task} run={run} state={state} actions={actions} />
        </div>
      ))}
    </section>
  )
}

export const RunSnapshotButton = ({
  task,
  run,
  state,
  actions,
}: Omit<HistoryContext, 'runs'> & { run: Run }) => {
  const { t } = useI18n()
  return (
    <CreateDialog
      title="执行记录快照"
      trigger={`${t('第')}${run.attempt}${t('次 ·')}${t(runLabel(run))} · ${run.id.slice(0, 8)}`}
      primary={false}
      closeIcon
      error=""
    >
      {(close) => (
        <RunSnapshot task={task} run={run} state={state} actions={actions} close={close} />
      )}
    </CreateDialog>
  )
}

const RunSnapshot = ({
  task,
  run,
  state,
  actions,
  close,
}: Omit<HistoryContext, 'runs'> & { run: Run; close: () => void }) => {
  const { t } = useI18n()
  return (
    <div className="run-snapshot-dialog">
      <div className="review-dialog-content">
        <p className="code">{run.id}</p>
        <h3>{t(runLabel(run))}</h3>
        {run.failureCode && (
          <p role="alert">
            {t('失败原因：')}
            {run.failureCode}
          </p>
        )}
        <RunFacts run={run} />
        <p className="snapshot-note">
          {t('此记录是该次执行时的快照，之后修改角色配置不会改写历史。')}
        </p>
        <SnapshotInstructions run={run} />
        <RunInputs run={run} state={state} />
        <RunActivity key={run.id} runId={run.id} cursor={state.cursor} />
      </div>
      <footer className="review-dialog-footer">
        <button onClick={close}>{t('关闭')}</button>
        {run.purpose !== 'role_trial' && (
          <DeliveryReview task={task} run={run} state={state} actions={actions} />
        )}
      </footer>
    </div>
  )
}

const SnapshotInstructions = ({ run }: { run: Run }) => {
  const { t } = useI18n()
  return (
    <section className="snapshot-instructions">
      <h4>{t('任务目标快照')}</h4>
      <p className="preserve-text">{run.goalSnapshot}</p>
      <h4>{t('验收标准快照')}</h4>
      <p className="preserve-text">{run.acceptanceSnapshot}</p>
      {run.feedbackSnapshot && (
        <>
          <h4>{t('本次修订依据')}</h4>
          <p className="preserve-text">{run.feedbackSnapshot}</p>
        </>
      )}
      <details>
        <summary>{t('角色职责与要求快照')}</summary>
        <p className="preserve-text">{run.roleSnapshot.responsibility}</p>
        {run.roleSnapshot.inputRequirements && (
          <>
            <h5>{t('输入要求')}</h5>
            <p className="preserve-text">{run.roleSnapshot.inputRequirements}</p>
          </>
        )}
        {run.roleSnapshot.deliveryRequirements && (
          <>
            <h5>{t('交付要求')}</h5>
            <p className="preserve-text">{run.roleSnapshot.deliveryRequirements}</p>
          </>
        )}
      </details>
    </section>
  )
}

export const RunFacts = ({ run }: { run: Run }) => {
  const { t, language } = useI18n()
  const formatTime = (value: string | null, empty: string) =>
    value ? new Date(value).toLocaleString(language) : t(empty)
  const profile = run.roleSnapshot.modelProfileSnapshot
  const profileLabel = profile ? `${profile.name} · v${profile.version}` : t('CLI 账户配置')
  const rows = [
    ['执行成员', `${run.roleSnapshot.name} · v${run.roleSnapshot.version}`],
    ['执行引擎', `${run.roleSnapshot.cli} · ${run.roleSnapshot.model || t('CLI 默认模型')}`],
    ['模型配置快照', profileLabel],
    ['权限快照', t(run.roleSnapshot.permission === 'read-only' ? '只读' : '工作区写入')],
    ['角色并发上限', String(run.roleSnapshot.maxConcurrency ?? 1)],
    [
      'Skills',
      run.roleSnapshot.skills
        .map((ref) => `${ref.id.slice(0, 8)} @${ref.digest.slice(0, 12)}`)
        .join(', ') || t('未绑定技能'),
    ],
    ['开始时间', formatTime(run.startedAt, '尚未开始')],
    ['结束时间', formatTime(run.endedAt, '尚未结束')],
    ['执行分支', run.executionBranch],
    ['基准提交', run.baselineCommit],
    ['工作目录', run.workDirectory],
    ['进程状态', t(processLabels[run.processState])],
  ] as const
  return (
    <dl className="run-facts">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{t(label)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const processLabels: Record<Run['processState'], string> = {
  not_started: '尚未启动进程',
  active: '进程运行中',
  confirmed_ended: '已确认结束',
  uncertain: '状态待确认',
}
