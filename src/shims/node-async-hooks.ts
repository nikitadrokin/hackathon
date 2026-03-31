type NativeAsyncLocalStorageConstructor = new <T>() => {
	run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R
	enterWith(store: T): void
	disable(): void
	getStore(): T | undefined
}

const isNodeRuntime =
	typeof globalThis.process !== 'undefined' &&
	Boolean(globalThis.process?.versions?.node)

const nativeAsyncHooks = isNodeRuntime
	? await import(/* @vite-ignore */ ['node', 'async_hooks'].join(':'))
	: null

const NativeAsyncLocalStorage =
	nativeAsyncHooks?.AsyncLocalStorage as
		| NativeAsyncLocalStorageConstructor
		| undefined

export class AsyncLocalStorage<T> {
	private nativeStore = NativeAsyncLocalStorage
		? new NativeAsyncLocalStorage<T>()
		: null

	private store: T | undefined

	run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R {
		if (this.nativeStore) {
			return this.nativeStore.run(store, callback, ...args)
		}

		const previousStore = this.store
		this.store = store

		try {
			return callback(...args)
		} finally {
			this.store = previousStore
		}
	}

	enterWith(store: T): void {
		if (this.nativeStore) {
			this.nativeStore.enterWith(store)
			return
		}

		this.store = store
	}

	disable(): void {
		if (this.nativeStore) {
			this.nativeStore.disable()
			return
		}

		this.store = undefined
	}

	getStore(): T | undefined {
		if (this.nativeStore) {
			return this.nativeStore.getStore()
		}

		return this.store
	}
}

export default { AsyncLocalStorage }
