import {
	ImagePlus,
	Mic,
	NotebookPen,
	RotateCcw,
	Square,
	Upload,
	WandSparkles,
} from "lucide-react";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { formatTime } from "./format-time";
import type { AddMode, NewCardPayload } from "./types";

/** Preferred MediaRecorder output types (first supported wins). */
const RECORDER_MIME_CANDIDATES = [
	"audio/webm;codecs=opus",
	"audio/webm",
	"audio/mp4",
	"audio/ogg;codecs=opus",
] as const;

function pickRecorderMimeType(): string | undefined {
	for (const t of RECORDER_MIME_CANDIDATES) {
		if (
			typeof MediaRecorder !== "undefined" &&
			MediaRecorder.isTypeSupported(t)
		) {
			return t;
		}
	}
	return undefined;
}

type PcmTapNodes = {
	audioContext: AudioContext;
	source: MediaStreamAudioSourceNode;
	processor: ScriptProcessorNode;
	gain: GainNode;
};

function disconnectPcmTap(nodes: PcmTapNodes | null): void {
	if (!nodes) return;
	nodes.processor.disconnect();
	nodes.source.disconnect();
	nodes.gain.disconnect();
	void nodes.audioContext.close();
}

export function AddCard({
	onAdd,
}: {
	onAdd: (card: NewCardPayload) => void | Promise<void>;
}) {
	const [mode, setMode] = useState<AddMode>(null);
	const [text, setText] = useState("");
	const [dragging, setDragging] = useState(false);
	const [recState, setRecState] = useState<
		"idle" | "recording" | "transcribing" | "done"
	>("idle");
	const [recSeconds, setRecSeconds] = useState(0);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audioData, setAudioData] = useState<string | null>(null);
	const [audioDuration, setAudioDuration] = useState(0);
	const [voiceTranscript, setVoiceTranscript] = useState("");
	const [transcribeError, setTranscribeError] = useState<string | null>(null);
	const [recorderError, setRecorderError] = useState<string | null>(null);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const chunks = useRef<Blob[]>([]);
	const timer = useRef<ReturnType<typeof setInterval> | null>(null);
	const transcribeGenRef = useRef(0);
	const voiceBlobRef = useRef<Blob | null>(null);
	const pcmChunksRef = useRef<Float32Array[]>([]);
	const pcmTapRef = useRef<PcmTapNodes | null>(null);

	const runTranscription = useCallback(
		async (blob: Blob, pcm16kMono?: Float32Array) => {
			transcribeGenRef.current += 1;
			const gen = transcribeGenRef.current;
			setRecState("transcribing");
			setTranscribeError(null);
			setRecorderError(null);
			try {
				const { transcribePcm16kHzMono, transcribeVoiceBlob } = await import(
					"#/lib/transcribeVoiceBlob"
				);
				const usePcm = pcm16kMono !== undefined && pcm16kMono.length > 0;
				const text = usePcm
					? await transcribePcm16kHzMono(pcm16kMono)
					: await transcribeVoiceBlob(blob);
				if (transcribeGenRef.current !== gen) return;
				setVoiceTranscript(text);
			} catch {
				if (transcribeGenRef.current !== gen) return;
				setTranscribeError(
					"Could not transcribe in the browser. Edit the text below or save audio only.",
				);
				setVoiceTranscript("");
			}
			if (transcribeGenRef.current === gen) {
				setRecState("done");
			}
		},
		[],
	);

	const startRecording = useCallback(async () => {
		let stream: MediaStream | null = null;
		try {
			setRecorderError(null);
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaStream = stream;
			const chosenMime = pickRecorderMimeType();
			const mr = chosenMime
				? new MediaRecorder(mediaStream, { mimeType: chosenMime })
				: new MediaRecorder(mediaStream);
			mediaRecorder.current = mr;
			chunks.current = [];
			pcmChunksRef.current = [];

			const audioCtx = new AudioContext();
			const source = audioCtx.createMediaStreamSource(mediaStream);
			const processor = audioCtx.createScriptProcessor(4096, 1, 1);
			processor.onaudioprocess = (e) => {
				const ch0 = e.inputBuffer.getChannelData(0);
				pcmChunksRef.current.push(new Float32Array(ch0));
			};
			const gain = audioCtx.createGain();
			gain.gain.value = 0;
			source.connect(processor);
			processor.connect(gain);
			gain.connect(audioCtx.destination);
			pcmTapRef.current = { audioContext: audioCtx, source, processor, gain };

			mr.ondataavailable = (e) => {
				if (e.data.size > 0) chunks.current.push(e.data);
			};
			mr.onstop = () => {
				void (async () => {
					for (const t of mediaStream.getTracks()) t.stop();

					const recordedType = mr.mimeType || chosenMime || "";
					const blob = new Blob(chunks.current, {
						type: recordedType || undefined,
					});

					const sampleRate =
						pcmTapRef.current?.audioContext.sampleRate ?? 48_000;
					const pcmParts = pcmChunksRef.current;
					pcmChunksRef.current = [];

					disconnectPcmTap(pcmTapRef.current);
					pcmTapRef.current = null;

					let pcm16kMono: Float32Array | undefined;
					const totalSamples = pcmParts.reduce(
						(sum, chunk) => sum + chunk.length,
						0,
					);
					if (totalSamples > 0) {
						const merged = new Float32Array(totalSamples);
						let offset = 0;
						for (const chunk of pcmParts) {
							merged.set(chunk, offset);
							offset += chunk.length;
						}

						const { resampleTo16kHzMono } = await import(
							"#/lib/transcribeVoiceBlob"
						);
						pcm16kMono = resampleTo16kHzMono(merged, sampleRate);
					}

					voiceBlobRef.current = blob;
					setAudioUrl((prev) => {
						if (prev) URL.revokeObjectURL(prev);
						return URL.createObjectURL(blob);
					});
					const reader = new FileReader();
					reader.onload = (ev) => {
						if (ev.target?.result) setAudioData(ev.target.result as string);
					};
					reader.readAsDataURL(blob);
					void runTranscription(blob, pcm16kMono);
				})();
			};

			mr.start();
			setRecState("recording");
			setRecSeconds(0);
			timer.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
		} catch {
			disconnectPcmTap(pcmTapRef.current);
			pcmTapRef.current = null;
			pcmChunksRef.current = [];
			if (stream) {
				for (const t of stream.getTracks()) t.stop();
			}
			setRecorderError(
				"Microphone access is blocked. Allow it in the browser and try again.",
			);
			setRecState("idle");
		}
	}, [runTranscription]);

	useEffect(() => {
		if (mode === "text") {
			setTimeout(() => textareaRef.current?.focus(), 50);
		}
	}, [mode]);

	useEffect(() => {
		return () => {
			if (timer.current) {
				clearInterval(timer.current);
				timer.current = null;
			}
			disconnectPcmTap(pcmTapRef.current);
			pcmTapRef.current = null;
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [audioUrl]);

	function resetVoiceDraft() {
		transcribeGenRef.current += 1;
		if (timer.current) {
			clearInterval(timer.current);
			timer.current = null;
		}
		setRecSeconds(0);
		setAudioDuration(0);
		setRecState("idle");
		setAudioUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
		setAudioData(null);
		setVoiceTranscript("");
		setTranscribeError(null);
		setRecorderError(null);
		voiceBlobRef.current = null;
	}

	function switchMode(m: AddMode) {
		transcribeGenRef.current += 1;
		if (mode === "voice" && recState === "recording") {
			if (timer.current) clearInterval(timer.current);
			mediaRecorder.current?.stop();
		}
		setMode((prev) => (prev === m ? null : m));
		setText("");
		setRecState("idle");
		setAudioUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
		setAudioData(null);
		setVoiceTranscript("");
		setTranscribeError(null);
		setRecorderError(null);
		voiceBlobRef.current = null;
		setAudioDuration(0);
		setRecSeconds(0);
	}

	async function submitText() {
		const trimmed = text.trim();
		if (!trimmed) return;
		await onAdd({ type: "text", text: trimmed });
		setText("");
		setMode(null);
	}

	function handleTextKey(e: KeyboardEvent) {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submitText();
		if (e.key === "Escape") setMode(null);
	}

	async function handleFile(file: File) {
		if (!file.type.startsWith("image/")) return;
		const reader = new FileReader();
		reader.onload = async (ev) => {
			if (ev.target?.result) {
				await onAdd({ type: "image", imageData: ev.target.result as string });
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
				setMode(null);
			}
		};
		reader.readAsDataURL(file);
	}

	function stopRecording() {
		if (timer.current) {
			clearInterval(timer.current);
			timer.current = null;
		}
		setAudioDuration(recSeconds);
		mediaRecorder.current?.stop();
	}

	async function saveVoice() {
		if (!audioData) return;
		const trimmed = voiceTranscript.trim();
		await onAdd({
			type: "voice",
			audioData,
			audioDuration,
			...(trimmed ? { text: trimmed } : {}),
		});
		resetVoiceDraft();
		setMode(null);
	}

	function retryTranscription() {
		const blob = voiceBlobRef.current;
		if (!blob) return;
		void runTranscription(blob);
	}

	return (
		<section className="app-panel overflow-hidden">
			<div className="border-b border-[var(--edge)] px-5 py-5 sm:px-6">
				<p className="section-kicker">Capture</p>
				<div className="mt-4 flex flex-wrap gap-2">
					<button
						type="button"
						className={`app-chip ${mode === "text" ? "is-active" : ""}`}
						onClick={() => switchMode("text")}
					>
						<NotebookPen aria-hidden="true" className="size-4" />
						<span className="font-semibold">Note</span>
					</button>
					<button
						type="button"
						className={`app-chip ${mode === "image" ? "is-active" : ""}`}
						onClick={() => switchMode("image")}
					>
						<ImagePlus aria-hidden="true" className="size-4" />
						<span className="font-semibold">Image</span>
					</button>
					<button
						type="button"
						className={`app-chip ${mode === "voice" ? "is-active" : ""}`}
						onClick={() => switchMode("voice")}
					>
						<Mic aria-hidden="true" className="size-4" />
						<span className="font-semibold">Voice</span>
					</button>
				</div>
			</div>

			<div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
				{!mode ? (
					<div className="rounded-[24px] border border-dashed border-[var(--edge)] bg-[var(--surface)] px-5 py-6">
						<p className="display-title text-3xl text-[var(--ink)]">
							Start with whatever you have.
						</p>
						<p className="mt-3 max-w-md text-sm leading-7 text-[var(--ink-soft)]">
							Drop in a quick note, a screenshot, or a voice fragment. The app
							will structure it after it lands.
						</p>
					</div>
				) : null}

				{mode === "text" ? (
					<div className="space-y-4">
						<label className="grid gap-2" htmlFor="capture-text">
							<span className="text-sm font-semibold text-[var(--ink)]">
								Quick Note
							</span>
							<textarea
								ref={textareaRef}
								id="capture-text"
								name="capture_text"
								className="app-textarea"
								onChange={(event) => setText(event.target.value)}
								onKeyDown={handleTextKey}
								placeholder="Write a thought, reminder, or fragment…"
								rows={6}
								value={text}
							/>
						</label>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<p className="text-sm text-[var(--ink-soft)]">
								Use <span className="font-semibold">⌘/Ctrl + Enter</span> to
								save quickly.
							</p>
							<button
								type="button"
								className="app-button"
								disabled={!text.trim()}
								onClick={() => void submitText()}
							>
								Save Note
							</button>
						</div>
					</div>
				) : null}

				{mode === "image" ? (
					<label
						className={`block rounded-[24px] border border-dashed px-5 py-8 text-center transition-[background-color,border-color,color] duration-150 ${
							dragging
								? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--ink)]"
								: "border-[var(--edge)] bg-[var(--surface)] text-[var(--ink-soft)]"
						}`}
						onDragLeave={() => setDragging(false)}
						onDragOver={(event) => {
							event.preventDefault();
							setDragging(true);
						}}
						onDrop={(event) => {
							event.preventDefault();
							setDragging(false);
							const file = event.dataTransfer.files[0];
							if (file) {
								void handleFile(file);
							}
						}}
					>
						<input
							ref={fileInputRef}
							accept="image/*"
							className="sr-only"
							onChange={(event) => {
								const file = event.target.files?.[0];
								if (file) {
									void handleFile(file);
								}
							}}
							type="file"
						/>
						<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent-strong)]">
							<Upload aria-hidden="true" className="size-6" />
						</div>
						<p className="text-lg font-semibold text-[var(--ink)]">
							{dragging ? "Drop the image here." : "Upload a visual reference."}
						</p>
						<p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
							Click to choose a file or drag one in from the desktop.
						</p>
					</label>
				) : null}

				{mode === "voice" ? (
					<div className="space-y-4">
						<div className="rounded-[24px] border border-[var(--edge)] bg-[var(--surface)] px-5 py-5">
							<p className="text-lg font-semibold text-[var(--ink)]">
								Voice Capture
							</p>
							<p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
								Record first, then decide how much of the transcript to keep.
							</p>

							{recState === "idle" && !audioUrl ? (
								<div className="mt-4 flex flex-wrap items-center gap-3">
									<button
										type="button"
										className="app-button"
										onClick={() => void startRecording()}
									>
										<Mic aria-hidden="true" className="size-4" />
										Start Recording
									</button>
									<p className="text-sm text-[var(--ink-soft)]">
										Local transcription runs after the recording stops.
									</p>
								</div>
							) : null}

							{recState === "recording" ? (
								<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
									<div className="flex items-center gap-3">
										<span className="relative flex size-3">
											<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-75" />
											<span className="relative inline-flex size-3 rounded-full bg-[var(--danger)]" />
										</span>
										<p className="text-sm font-semibold text-[var(--ink)]">
											Recording
										</p>
										<p className="text-sm text-[var(--ink-soft)] [font-variant-numeric:tabular-nums]">
											{formatTime(recSeconds)}
										</p>
									</div>
									<button
										type="button"
										className="app-button-secondary"
										onClick={stopRecording}
									>
										<Square aria-hidden="true" className="size-4" />
										Stop
									</button>
								</div>
							) : null}

							{recState === "transcribing" ? (
								<p
									aria-live="polite"
									className="mt-4 text-sm leading-7 text-[var(--ink-soft)]"
								>
									Transcribing locally… The first run may download a small
									speech model into the browser.
								</p>
							) : null}

							{recorderError ? (
								<p
									aria-live="polite"
									className="mt-4 rounded-[18px] border border-[color:rgba(155,50,33,0.18)] bg-[color:rgba(155,50,33,0.08)] px-4 py-3 text-sm text-[var(--danger)]"
									role="alert"
								>
									{recorderError}
								</p>
							) : null}
						</div>

						{recState === "done" && audioUrl ? (
							<div className="space-y-4">
								<div className="rounded-[24px] border border-[var(--edge)] bg-[var(--surface)] p-4">
									<audio className="w-full" controls src={audioUrl}>
										<track kind="captions" label="Transcript preview" />
									</audio>
								</div>
								<label className="grid gap-2" htmlFor="voice-transcript-draft">
									<span className="text-sm font-semibold text-[var(--ink)]">
										Transcript Draft
									</span>
									<textarea
										id="voice-transcript-draft"
										name="voice_transcript_draft"
										className="app-textarea"
										onChange={(event) => setVoiceTranscript(event.target.value)}
										placeholder="Transcript appears here. Edit it before saving…"
										rows={5}
										value={voiceTranscript}
									/>
								</label>
								{transcribeError ? (
									<p
										aria-live="polite"
										className="rounded-[18px] border border-[color:rgba(168,91,8,0.18)] bg-[color:rgba(168,91,8,0.08)] px-4 py-3 text-sm text-[var(--warning)]"
										role="alert"
									>
										{transcribeError}
									</p>
								) : null}
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											className="app-button-secondary"
											onClick={resetVoiceDraft}
										>
											<RotateCcw aria-hidden="true" className="size-4" />
											Record Again
										</button>
										<button
											type="button"
											className="app-button-secondary"
											onClick={retryTranscription}
										>
											<WandSparkles aria-hidden="true" className="size-4" />
											Transcribe Again
										</button>
									</div>
									<button
										type="button"
										className="app-button"
										onClick={() => void saveVoice()}
									>
										Save Recording
									</button>
								</div>
							</div>
						) : null}
					</div>
				) : null}
			</div>
		</section>
	);
}
