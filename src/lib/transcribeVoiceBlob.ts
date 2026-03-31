import type { AutomaticSpeechRecognitionPipelineType } from "@xenova/transformers";

const WHISPER_SAMPLE_RATE = 16_000;

/** Lazily loaded in-browser Whisper pipeline (downloads model on first use). */
let transcriberPromise: Promise<AutomaticSpeechRecognitionPipelineType> | null =
	null;

async function getTranscriber(): Promise<AutomaticSpeechRecognitionPipelineType> {
	if (!transcriberPromise) {
		transcriberPromise = (async () => {
			const { pipeline, env } = await import("@xenova/transformers");
			env.allowLocalModels = false;
			env.useBrowserCache = true;
			if (typeof SharedArrayBuffer === "undefined" && env.backends.onnx?.wasm) {
				env.backends.onnx.wasm.numThreads = 1;
			}
			return pipeline(
				"automatic-speech-recognition",
				"Xenova/whisper-tiny.en",
			) as Promise<AutomaticSpeechRecognitionPipelineType>;
		})();
	}
	return transcriberPromise;
}

/**
 * Linear resample mono PCM to 16 kHz (Whisper feature extractor rate).
 * @param input Mono samples at `inputRate` Hz
 * @param inputRate Source sample rate in Hz
 */
export function resampleTo16kHzMono(
	input: Float32Array,
	inputRate: number,
): Float32Array {
	if (inputRate === WHISPER_SAMPLE_RATE) {
		return input;
	}
	const ratio = inputRate / WHISPER_SAMPLE_RATE;
	const outLen = Math.max(1, Math.floor(input.length / ratio));
	const out = new Float32Array(outLen);
	for (let i = 0; i < outLen; i += 1) {
		const srcPos = i * ratio;
		const j = Math.floor(srcPos);
		const f = srcPos - j;
		const a = input[j] ?? 0;
		const b = input[j + 1] ?? a;
		out[i] = a * (1 - f) + b * f;
	}
	return out;
}

/**
 * Decode a recorded blob (e.g. WebM from MediaRecorder) to mono 16 kHz float samples for Whisper.
 */
export async function decodeRecordingToWhisperPcm(
	blob: Blob,
): Promise<Float32Array> {
	const arrayBuffer = await blob.arrayBuffer();
	const audioContext = new AudioContext();
	try {
		const audioBuffer = await audioContext.decodeAudioData(
			arrayBuffer.slice(0),
		);
		const { numberOfChannels, length, sampleRate } = audioBuffer;
		const mono = new Float32Array(length);
		for (let ch = 0; ch < numberOfChannels; ch += 1) {
			const data = audioBuffer.getChannelData(ch);
			for (let i = 0; i < length; i += 1) {
				mono[i] += data[i] / numberOfChannels;
			}
		}
		return resampleTo16kHzMono(mono, sampleRate);
	} finally {
		await audioContext.close();
	}
}

/**
 * Transcribe mono 16 kHz PCM using the in-browser Whisper pipeline.
 * @param pcm Mono float samples at 16 kHz
 */
export async function transcribePcm16kHzMono(
	pcm: Float32Array,
): Promise<string> {
	const transcriber = await getTranscriber();
	const raw = await transcriber(pcm, {
		chunk_length_s: 30,
		stride_length_s: 5,
	});
	const items = Array.isArray(raw) ? raw : [raw];
	const parts = items.map((item) => item.text.trim()).filter(Boolean);
	return parts.join(" ").trim();
}

/**
 * Transcribe a voice memo blob fully in the browser using Transformers.js (no STT API key).
 */
export async function transcribeVoiceBlob(blob: Blob): Promise<string> {
	const pcm = await decodeRecordingToWhisperPcm(blob);
	return transcribePcm16kHzMono(pcm);
}
