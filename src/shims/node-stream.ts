type NativeReadableType = {
	fromWeb<T>(stream: T): T;
	toWeb<T>(stream: T): T;
	from<T>(stream: T): T;
};

type NativePassThroughConstructor = new () => {
	destroyed: boolean;
	destroy(error?: unknown): unknown;
	pipe<T>(destination: T): T;
};

type NativeDuplexInstance = {
	pipe?<T>(destination: T): T;
};

type NativeDuplexConstructor = new (
	...args: Array<unknown>
) => NativeDuplexInstance;

const isNodeRuntime =
	typeof globalThis.process !== "undefined" &&
	Boolean(globalThis.process?.versions?.node);

const nativeStreamModule = isNodeRuntime
	? await import(/* @vite-ignore */ ["node", "stream"].join(":"))
	: null;

const NativeReadable = nativeStreamModule?.Readable as
	| NativeReadableType
	| undefined;
const NativePassThrough = nativeStreamModule?.PassThrough as
	| NativePassThroughConstructor
	| undefined;
const NativeDuplex = nativeStreamModule?.Duplex as
	| NativeDuplexConstructor
	| undefined;

export const Readable = {
	fromWeb<T>(stream: T): T {
		if (NativeReadable) {
			return NativeReadable.fromWeb(stream);
		}

		return stream;
	},

	toWeb<T>(stream: T): T {
		if (NativeReadable) {
			return NativeReadable.toWeb(stream);
		}

		return stream;
	},

	from<T>(stream: T): T {
		if (NativeReadable) {
			return NativeReadable.from(stream);
		}

		return stream;
	},
};

export class PassThrough {
	private nativeStream = NativePassThrough ? new NativePassThrough() : null;

	get destroyed() {
		return this.nativeStream?.destroyed ?? false;
	}

	pipe<T>(destination: T) {
		if (this.nativeStream) {
			return this.nativeStream.pipe(destination);
		}

		return destination;
	}

	destroy(error?: unknown) {
		if (this.nativeStream) {
			return this.nativeStream.destroy(error);
		}

		return this;
	}
}

export class Duplex extends PassThrough {
	private nativeDuplex = NativeDuplex ? new NativeDuplex() : null;

	override pipe<T>(destination: T) {
		if (this.nativeDuplex?.pipe) {
			return this.nativeDuplex.pipe(destination);
		}

		return super.pipe(destination);
	}
}

export default {
	Duplex,
	PassThrough,
	Readable,
};
