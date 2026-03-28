export class AsyncLocalStorage<T> {
  private store: T | undefined

  run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R {
    const previousStore = this.store
    this.store = store

    try {
      return callback(...args)
    } finally {
      this.store = previousStore
    }
  }

  enterWith(store: T): void {
    this.store = store
  }

  disable(): void {
    this.store = undefined
  }

  getStore(): T | undefined {
    return this.store
  }
}

export default { AsyncLocalStorage }
