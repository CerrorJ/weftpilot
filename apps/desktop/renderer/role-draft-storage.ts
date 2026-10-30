type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>

/** 仅缓存不含密钥的界面草稿。浏览器存储拒绝时保留本窗口内存，删除失败用墓碑防止旧稿复活。 */
export class RoleDraftStorage {
  private readonly memory = new Map<string, string | null>()
  private readonly dirty = new Set<string>()
  private unavailable = false

  constructor(private readonly storage: () => StoragePort = () => sessionStorage) {}

  read(key: string): string | null {
    if (this.dirty.has(key)) return this.memory.get(key) ?? null
    try {
      const value = this.storage().getItem(key)
      this.unavailable = false
      if (value === null) this.memory.delete(key)
      else this.memory.set(key, value)
      return value
    } catch {
      this.unavailable = true
      return this.memory.get(key) ?? null
    }
  }

  write(key: string, value: string): void {
    this.memory.set(key, value)
    try {
      this.storage().setItem(key, value)
      this.dirty.delete(key)
      this.unavailable = false
    } catch {
      this.dirty.add(key)
      this.unavailable = true
    }
  }

  remove(key: string): void {
    this.memory.set(key, null)
    try {
      this.storage().removeItem(key)
      this.memory.delete(key)
      this.dirty.delete(key)
      this.unavailable = false
    } catch {
      this.dirty.add(key)
      this.unavailable = true
    }
  }

  keys(): string[] {
    const keys = new Set<string>()
    try {
      const storage = this.storage()
      for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index)
        if (key !== null) keys.add(key)
      }
      this.unavailable = false
    } catch {
      this.unavailable = true
      for (const key of this.memory.keys()) keys.add(key)
    }
    for (const key of this.dirty) keys.add(key)
    return [...keys].filter((key) => !(this.dirty.has(key) && this.memory.get(key) === null))
  }

  volatile(): boolean {
    return this.unavailable || this.dirty.size > 0
  }
}

export const roleDraftStorage = new RoleDraftStorage()
