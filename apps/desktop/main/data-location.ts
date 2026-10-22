import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
  unlinkSync,
} from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import {
  dataSlotSchema,
  restoreOperationSchema as operationSchema,
  type RestoreOperation,
} from '../../../packages/kernel-client/maintenance-contract'
export type { RestoreOperation } from '../../../packages/kernel-client/maintenance-contract'

const locationSchema = z.object({ version: z.literal(1), slot: dataSlotSchema }).strict()

/** 指针只保存受控目录标识，不接收页面提供的数据库位置；旧目录始终保留。 */
export class DataLocation {
  constructor(private readonly userData: string) {}

  slot(): string {
    const path = join(this.userData, 'active-kernel.json')
    if (!existsSync(path)) return 'default'
    try {
      return locationSchema.parse(JSON.parse(readFileSync(path, 'utf8'))).slot
    } catch {
      throw new Error('DATA_LOCATION_INVALID')
    }
  }

  directory(slot: string = this.slot()): string {
    dataSlotSchema.parse(slot)
    if (slot === 'default') return join(this.userData, 'kernel')
    const parent = join(this.userData, 'workspaces')
    if (
      existsSync(parent) &&
      (lstatSync(parent).isSymbolicLink() || !lstatSync(parent).isDirectory())
    )
      throw new Error('DATA_LOCATION_INVALID')
    mkdirSync(parent, { recursive: true, mode: 0o700 })
    return join(parent, slot)
  }

  activate(slot: string): void {
    atomicJson(
      join(this.userData, 'active-kernel.json'),
      locationSchema.parse({ version: 1, slot }),
    )
  }

  record(operation: RestoreOperation): void {
    atomicJson(join(this.userData, 'restore-operation.json'), operationSchema.parse(operation))
  }

  operation(): RestoreOperation | null {
    const path = join(this.userData, 'restore-operation.json')
    if (!existsSync(path)) return null
    try {
      return operationSchema.parse(JSON.parse(readFileSync(path, 'utf8')))
    } catch {
      throw new Error('DATA_LOCATION_INVALID')
    }
  }
}

/** 同目录替换，不先删除旧指针；Windows替换失败时保留原有效位置。 */
const atomicJson = (path: string, value: unknown): void => {
  const temporary = `${path}.${randomUUID()}.tmp`
  writeFileSync(temporary, JSON.stringify(value), { flag: 'wx', mode: 0o600, flush: true })
  try {
    renameSync(temporary, path)
  } catch (error) {
    unlinkSync(temporary)
    throw error
  }
}
