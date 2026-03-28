import { useAction, useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import ThemeToggle from './ThemeToggle';

type MindCardDoc = Doc<'mindCards'>;

function formatTime(s: number) {
	const m = Math.floor(s / 60);
	return `${m}:${Math.floor(s % 60)
		.toString()
		.padStart(2, '0')}`;
}

const SIDEBAR_ICON_CLASS =
	'w-[38px] h-[38px] rounded-[10px] border-none bg-transparent text-[#bbb] flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-[#ebebeb] hover:text-[#555]';

const TAB_CLASS =
	'px-[14px] py-[6px] rounded-full border-none bg-transparent text-[13px] font-medium text-[#aaa] cursor-pointer transition-all duration-150 hover:text-[#555] hover:bg-[#ebebeb]';

const DELETE_BUTTON_CLASS =
	'absolute top-2 right-2 w-[26px] h-[26px] rounded-full border-none bg-[rgba(0,0,0,0.06)] text-[#888] text-[16px] flex items-center justify-center cursor-pointer opacity-0 transition-all duration-150 z-[5] leading-none group-hover:opacity-100 hover:bg-[#fee2e2] hover:text-[#ef4444]';

const CARD_CLASS =
	'relative break-inside-avoid bg-white rounded-[14px] mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_1px_2px_rgba(0,0,0,0.04)] transition-[box-shadow,transform] duration-300 overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.1),_0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-1';

const ADD_CARD_CLASS =
	'p-[20px_20px_12px] border-[1.5px] border-dashed border-[#e0e0e0] bg-[#fafafa] shadow-none cursor-default';

const TYPE_BUTTON_CLASS =
	'w-[30px] h-[30px] rounded-[8px] border-none bg-transparent text-[#bbb] flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-[#f0f0f0] hover:text-[#666]';

const VOICE_BAR_CLASS =
	'flex-1 rounded-[2px] min-h-[3px] transition-[background] duration-100';

function Sidebar() {
	return (
		<aside className="fixed top-0 left-0 z-40 flex h-screen w-[60px] flex-col items-center border-r border-[#ebebeb] bg-[#f7f7f5] py-5">
			<div className="mb-7 select-none text-[11px] font-semibold uppercase tracking-[0.12em] text-[#999] [writing-mode:vertical-rl] rotate-180">
				<span>second brain</span>
			</div>
			<div className="flex flex-1 flex-col items-center gap-1">
				<button type="button" className={SIDEBAR_ICON_CLASS} aria-label="Recent">
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.6"
						width="20"
						height="20"
					>
						<circle cx="12" cy="12" r="9" />
						<path
							d="M12 7v5l3 3"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
				<button type="button" className={SIDEBAR_ICON_CLASS} aria-label="Appearance">
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.6"
						width="20"
						height="20"
					>
						<path
							d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
				<button type="button" className={SIDEBAR_ICON_CLASS} aria-label="Discover">
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.6"
						width="20"
						height="20"
					>
						<polygon
							points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
				<button type="button" className={SIDEBAR_ICON_CLASS} aria-label="Grid view">
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.6"
						width="20"
						height="20"
					>
						<rect x="3" y="3" width="7" height="7" rx="1" />
						<rect x="14" y="3" width="7" height="7" rx="1" />
						<rect x="3" y="14" width="7" height="7" rx="1" />
						<rect x="14" y="14" width="7" height="7" rx="1" />
					</svg>
				</button>
			</div>
			<div className="flex flex-col items-center gap-1">
				<div className="origin-center scale-[0.72]">
					<ThemeToggle />
				</div>
				<button type="button" className={SIDEBAR_ICON_CLASS} aria-label="Settings">
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.6"
						width="20"
						height="20"
					>
						<circle cx="12" cy="12" r="3" />
						<path
							d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
			</div>
		</aside>
	);
}

type AddMode = 'text' | 'image' | 'voice' | null;

type NewCardPayload = {
	type: 'text' | 'image' | 'voice';
	text?: string;
	imageData?: string;
	audioData?: string;
	audioDuration?: number;
};

function AddCard({ onAdd }: { onAdd: (card: NewCardPayload) => void | Promise<void> }) {
	const [mode, setMode] = useState<AddMode>(null);
	const [text, setText] = useState('');
	const [dragging, setDragging] = useState(false);
	const [recState, setRecState] = useState<'idle' | 'recording' | 'transcribing' | 'done'>(
		'idle',
	);
	const [recSeconds, setRecSeconds] = useState(0);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audioData, setAudioData] = useState<string | null>(null);
	const [audioDuration, setAudioDuration] = useState(0);
	const [voiceTranscript, setVoiceTranscript] = useState('');
	const [transcribeError, setTranscribeError] = useState<string | null>(null);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const chunks = useRef<Blob[]>([]);
	const timer = useRef<ReturnType<typeof setInterval> | null>(null);
	const transcribeGenRef = useRef(0);
	const voiceBlobRef = useRef<Blob | null>(null);

	const runTranscription = useCallback(async (blob: Blob) => {
		transcribeGenRef.current += 1;
		const gen = transcribeGenRef.current;
		setRecState('transcribing');
		setTranscribeError(null);
		try {
			const { transcribeVoiceBlob } = await import('#/lib/transcribeVoiceBlob');
			const text = await transcribeVoiceBlob(blob);
			if (transcribeGenRef.current !== gen) return;
			setVoiceTranscript(text);
		} catch {
			if (transcribeGenRef.current !== gen) return;
			setTranscribeError(
				'Could not transcribe in the browser. Edit the text below or save audio only.',
			);
			setVoiceTranscript('');
		}
		if (transcribeGenRef.current === gen) {
			setRecState('done');
		}
	}, []);

	const startRecording = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mr = new MediaRecorder(stream);
			mediaRecorder.current = mr;
			chunks.current = [];

			mr.ondataavailable = (e) => chunks.current.push(e.data);
			mr.onstop = () => {
				for (const t of stream.getTracks()) t.stop();
				const blob = new Blob(chunks.current, { type: 'audio/webm' });
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
				void runTranscription(blob);
			};

			mr.start();
			setRecState('recording');
			setRecSeconds(0);
			timer.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
		} catch {
			alert('Microphone access denied.');
			setMode(null);
		}
	}, [runTranscription]);

	useEffect(() => {
		if (mode === 'text') {
			setTimeout(() => textareaRef.current?.focus(), 50);
		}
	}, [mode]);

	useEffect(() => {
		if (mode === 'voice' && recState === 'idle') {
			startRecording();
		}
	}, [mode, recState, startRecording]);

	function switchMode(m: AddMode) {
		transcribeGenRef.current += 1;
		if (mode === 'voice' && recState === 'recording') {
			if (timer.current) clearInterval(timer.current);
			mediaRecorder.current?.stop();
		}
		setMode((prev) => (prev === m ? null : m));
		setText('');
		setRecState('idle');
		setAudioUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
		setAudioData(null);
		setVoiceTranscript('');
		setTranscribeError(null);
		voiceBlobRef.current = null;
	}

	async function submitText() {
		const trimmed = text.trim();
		if (!trimmed) return;
		await onAdd({ type: 'text', text: trimmed });
		setText('');
		setMode(null);
	}

	function handleTextKey(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submitText();
		if (e.key === 'Escape') setMode(null);
	}

	async function handleFile(file: File) {
		if (!file.type.startsWith('image/')) return;
		const reader = new FileReader();
		reader.onload = async (ev) => {
			if (ev.target?.result) {
				await onAdd({ type: 'image', imageData: ev.target.result as string });
				setMode(null);
			}
		};
		reader.readAsDataURL(file);
	}

	function stopRecording() {
		if (timer.current) clearInterval(timer.current);
		setAudioDuration(recSeconds);
		mediaRecorder.current?.stop();
	}

	async function saveVoice() {
		if (!audioData) return;
		const trimmed = voiceTranscript.trim();
		await onAdd({
			type: 'voice',
			audioData,
			audioDuration,
			...(trimmed ? { text: trimmed } : {}),
		});
		transcribeGenRef.current += 1;
		setAudioUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
		setAudioData(null);
		setVoiceTranscript('');
		setTranscribeError(null);
		voiceBlobRef.current = null;
		setMode(null);
		setRecState('idle');
	}

	function retryTranscription() {
		const blob = voiceBlobRef.current;
		if (!blob) return;
		void runTranscription(blob);
	}

	return (
		<div
			className={`${CARD_CLASS} ${ADD_CARD_CLASS} ${
				mode ? 'border-[#d0d0d0] bg-white' : ''
			}`}
		>
			{!mode && (
				<>
					<p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#bbb]">
						ADD A NEW NOTE
					</p>
					<button
						type="button"
						className="mb-2.5 block w-full cursor-text border-none bg-transparent p-0 text-[14px] leading-[1.6] text-[#ccc] hover:text-[#aaa]"
						onClick={() => switchMode('text')}
					>
						Start typing here...
					</button>
				</>
			)}

			{mode === 'text' && (
				<div className="flex flex-col">
					<textarea
						ref={textareaRef}
						value={text}
						onChange={(e) => setText(e.target.value)}
						onKeyDown={handleTextKey}
						placeholder="What's on your mind..."
						className="font-[var(--font-body)] mb-2.5 w-full resize-none border-none bg-transparent p-0 text-[14px] leading-[1.7] text-[#1a1a1a] outline-none"
						rows={5}
					/>
					<div className="flex items-center justify-between">
						<span className="text-[11px] text-[#bbb]">⌘↵ save · esc cancel</span>
						<button
							type="button"
							onClick={() => void submitText()}
							disabled={!text.trim()}
							className="cursor-pointer rounded-lg border-none bg-[#1a1a1a] px-4 py-1.5 text-[12px] font-semibold text-[#fff] transition-opacity duration-150 hover:enabled:opacity-75 disabled:cursor-default disabled:opacity-25"
						>
							Save
						</button>
					</div>
				</div>
			)}

			{mode === 'image' && (
				<label
					className={`mb-2.5 flex cursor-pointer flex-col items-center justify-center gap-[10px] rounded-[10px] border-[1.5px] border-dashed border-[#ddd] p-[32px_20px] text-[13px] text-[#bbb] transition-all duration-150 hover:border-[#aaa] hover:bg-[#f5f5f5] hover:text-[#888] ${
						dragging ? 'border-[#aaa] bg-[#f5f5f5] text-[#888]' : ''
					}`}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragging(false);
						const f = e.dataTransfer.files[0];
						if (f) void handleFile(f);
					}}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) void handleFile(f);
						}}
					/>
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.4"
						width="28"
						height="28"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<path
							d="M21 15l-5-5L5 21"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<span>{dragging ? 'Drop it' : 'Click or drop image'}</span>
				</label>
			)}

			{mode === 'voice' && (
				<div className="mb-[10px] flex flex-col gap-[10px]">
					{recState === 'recording' && (
						<>
							<div className="flex items-center gap-2 text-[13px] text-[#555]">
								<span className="h-[7px] w-[7px] animate-pulse rounded-full bg-[#ef4444]" />
								<span className="text-[13px] text-[#888] [font-variant-numeric:tabular-nums]">
									{formatTime(recSeconds)}
								</span>
							</div>
							<button
								type="button"
								onClick={stopRecording}
								className="mt-3 self-start cursor-pointer rounded-lg border-none bg-[#1a1a1a] px-4 py-1.5 text-[12px] font-semibold text-[#fff] transition-opacity duration-150"
							>
								Stop
							</button>
						</>
					)}
					{recState === 'transcribing' && (
						<p className="m-0 text-[13px] leading-[1.5] text-[#888]">
							Transcribing locally… First run downloads a small speech model to your browser.
						</p>
					)}
					{recState === 'done' && audioUrl && (
						<>
							<audio src={audioUrl} controls className="w-full">
								<track kind="captions" />
							</audio>
							<label
								htmlFor="voice-transcript-draft"
								className="text-[10px] font-black uppercase tracking-[0.08em] text-[#bbb]"
							>
								Transcript
							</label>
							<textarea
								id="voice-transcript-draft"
								value={voiceTranscript}
								onChange={(e) => setVoiceTranscript(e.target.value)}
								placeholder="Transcript appears here; you can edit or paste from another tool."
								rows={4}
								className="font-[var(--font-body)] w-full resize-y rounded-[10px] border border-[#ebebeb] bg-[#fafafa] p-2.5 text-[13px] leading-[1.6] text-[#1a1a1a] outline-none focus:border-[#ccc]"
							/>
							{transcribeError ? (
								<p className="m-0 text-[12px] leading-[1.4] text-[#b45309]">{transcribeError}</p>
							) : null}
							<div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
								<div className="flex flex-wrap gap-2">
									<button
										type="button"
										onClick={() => {
											transcribeGenRef.current += 1;
											setAudioUrl((prev) => {
												if (prev) URL.revokeObjectURL(prev);
												return null;
											});
											setAudioData(null);
											setVoiceTranscript('');
											setTranscribeError(null);
											voiceBlobRef.current = null;
											setRecState('idle');
										}}
										className="cursor-pointer border-none bg-transparent p-0 text-[12px] text-[#aaa] hover:text-[#555]"
									>
										Re-record
									</button>
									<button
										type="button"
										onClick={retryTranscription}
										className="cursor-pointer border-none bg-transparent p-0 text-[12px] text-[#888] hover:text-[#333]"
									>
										Transcribe again
									</button>
								</div>
								<button
									type="button"
									onClick={() => void saveVoice()}
									className="cursor-pointer rounded-lg border-none bg-[#1a1a1a] px-4 py-1.5 text-[12px] font-semibold text-[#fff] transition-opacity duration-150 hover:enabled:opacity-75"
								>
									Save
								</button>
							</div>
						</>
					)}
				</div>
			)}

			<div className="mt-1 flex items-center gap-1 border-t border-[#f0f0f0] pt-[10px]">
				<button
					type="button"
					className={`${TYPE_BUTTON_CLASS} ${mode === 'text' ? 'bg-[#f0f0f0] text-[#1a1a1a]' : ''}`}
					onClick={() => switchMode('text')}
					aria-label="Write note"
				>
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						width="15"
						height="15"
					>
						<path d="M4 6h16M4 12h16M4 18h8" strokeLinecap="round" />
					</svg>
				</button>
				<button
					type="button"
					className={`${TYPE_BUTTON_CLASS} ${mode === 'image' ? 'bg-[#f0f0f0] text-[#1a1a1a]' : ''}`}
					onClick={() => switchMode('image')}
					aria-label="Add image"
				>
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						width="15"
						height="15"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<path
							d="M21 15l-5-5L5 21"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
				<button
					type="button"
					className={`${TYPE_BUTTON_CLASS} ${mode === 'voice' ? 'bg-[#f0f0f0] text-[#1a1a1a]' : ''}`}
					onClick={() => switchMode('voice')}
					aria-label="Record voice"
				>
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						width="15"
						height="15"
					>
						<rect x="9" y="2" width="6" height="12" rx="3" />
						<path
							d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"
							strokeLinecap="round"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}

function AiMeta({ card }: { card: MindCardDoc }) {
	if (card.autoCategoryState === 'pending') {
		return (
			<p className="mt-2 text-[11px] text-[#aaa] italic">Structuring…</p>
		);
	}
	if (card.autoCategoryState === 'failed') {
		return (
			<p className="mt-2 text-[11px] text-[#c2410c]">
				{card.autoCategoryReason ?? 'Could not auto-structure.'}
			</p>
		);
	}
	if (card.autoCategoryState !== 'ready') return null;
	return (
		<div className="mt-3 space-y-1.5 border-t border-[#f0f0f0] pt-3">
			{card.title ? (
				<p className="m-0 text-[12px] font-semibold text-[#444]">{card.title}</p>
			) : null}
			{card.autoSummary ? (
				<p className="m-0 text-[12px] leading-relaxed text-[#777]">{card.autoSummary}</p>
			) : null}
			<div className="flex flex-wrap gap-1">
				{card.autoCategory ? (
					<span className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-medium text-[#555]">
						{card.autoCategory}
					</span>
				) : null}
				{card.autoTags.slice(0, 6).map((tag) => (
					<span
						key={tag}
						className="rounded-full bg-[#eef6f5] px-2 py-0.5 text-[10px] text-[#2d6a5d]"
					>
						{tag}
					</span>
				))}
			</div>
		</div>
	);
}

function TextCard({
	card,
	onDelete,
}: {
	card: MindCardDoc;
	onDelete: () => void;
}) {
	return (
		<div className={`${CARD_CLASS} group p-5`}>
			<button type="button" onClick={onDelete} className={DELETE_BUTTON_CLASS} aria-label="Delete note">
				×
			</button>
			<p className="m-0 whitespace-pre-wrap break-words text-[14px] leading-[1.7] text-[#333]">
				{card.text}
			</p>
			<AiMeta card={card} />
		</div>
	);
}

function ImageCard({
	card,
	onDelete,
}: {
	card: MindCardDoc;
	onDelete: () => void;
}) {
	const date = new Date(card.createdAt);
	const label = date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
	const src = card.imageData ?? '';
	return (
		<div className={`${CARD_CLASS} group p-0`}>
			<button type="button" onClick={onDelete} className={DELETE_BUTTON_CLASS} aria-label="Delete image">
				×
			</button>
			{src ? <img src={src} alt="" className="block h-auto w-full" /> : null}
			<div className="border-t border-[#f5f5f5] px-[14px] py-[10px]">
				<p className="m-0 text-[12px] text-[#999]">{label}</p>
				<AiMeta card={card} />
			</div>
		</div>
	);
}

function VoiceCard({
	card,
	onDelete,
}: {
	card: MindCardDoc;
	onDelete: () => void;
}) {
	const [playing, setPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const audioRef = useRef<HTMLAudioElement>(null);
	const idStr = card._id;

	const bars = useRef(
		Array.from({ length: 24 }, (_, i) => {
			const seed = idStr.charCodeAt(i % idStr.length) || 0;
			return {
				id: `${idStr}-b${i}`,
				h: 6 + Math.abs(Math.sin(i * 1.1 + seed * 0.01)) * 18,
			};
		}),
	);

	function toggle() {
		const a = audioRef.current;
		if (!a) return;
		if (playing) a.pause();
		else void a.play();
	}

	const duration = card.audioDurationSeconds ?? 0;
	const progress = duration > 0 ? currentTime / duration : 0;
	const src = card.audioData ?? '';

	return (
		<div className={`${CARD_CLASS} group p-[18px]`}>
			<button
				type="button"
				onClick={onDelete}
				className={DELETE_BUTTON_CLASS}
				aria-label="Delete recording"
			>
				×
			</button>
			<audio
				ref={audioRef}
				src={src}
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onEnded={() => {
					setPlaying(false);
					setCurrentTime(0);
				}}
				onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
			>
				<track kind="captions" />
			</audio>
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={toggle}
					className="flex h-[34px] w-[34px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[#e0e0e0] bg-white text-[#333] transition-all duration-150 hover:border-[#aaa] hover:bg-[#fafafa]"
					aria-label={playing ? 'Pause' : 'Play'}
				>
					{playing ? (
						<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
							<rect x="5" y="3" width="5" height="18" rx="1" />
							<rect x="14" y="3" width="5" height="18" rx="1" />
						</svg>
					) : (
						<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
							<polygon points="5,3 20,12 5,21" />
						</svg>
					)}
				</button>
				<div className="flex h-8 flex-1 items-center gap-[2px]">
					{bars.current.map(({ id, h }, i) => {
						const active = i / bars.current.length <= progress;
						return (
							<div
								key={id}
								className={VOICE_BAR_CLASS}
								style={{
									height: `${h}px`,
									background: active ? '#111' : '#ddd',
								}}
							/>
						);
					})}
				</div>
				<span className="flex-shrink-0 text-[11px] text-[#bbb] [font-variant-numeric:tabular-nums]">
					{duration > 0 ? formatTime(duration) : formatTime(currentTime)}
				</span>
			</div>
			{card.text?.trim() ? (
				<p className="mt-3 mb-0 whitespace-pre-wrap break-words text-[13px] leading-[1.65] text-[#444]">
					{card.text}
				</p>
			) : null}
			<AiMeta card={card} />
		</div>
	);
}

export default function MindApp() {
	const [search, setSearch] = useState('');
	const listArgs = search.trim() ? { search: search.trim() } : {};
	const cards = useQuery(api.mindCards.listCards, listArgs);
	const createCard = useMutation(api.mindCards.createCard);
	const removeCard = useMutation(api.mindCards.deleteCard);
	const classifyCard = useAction(api.mindCards.classifyCard);

	const addCard = useCallback(
		async (partial: NewCardPayload) => {
			const id = await createCard({
				type: partial.type,
				text: partial.text,
				imageData: partial.imageData,
				audioData: partial.audioData,
				audioDurationSeconds: partial.audioDuration,
			});
			void classifyCard({ id }).catch(() => {});
		},
		[createCard, classifyCard],
	);

	const deleteCard = useCallback(
		async (id: Id<'mindCards'>) => {
			await removeCard({ id });
		},
		[removeCard],
	);

	if (cards === undefined) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center bg-[#f7f7f5] text-[#999]">
				Loading…
			</div>
		);
	}

	return (
		<div className="font-[var(--font-body)] flex min-h-[calc(100dvh-1px)] bg-[#f7f7f5] text-sm text-[#1a1a1a]">
			<Sidebar />
			<div className="ml-[60px] flex min-h-[calc(100dvh-1px)] flex-1 flex-col">
				<header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[#ebebeb] bg-[rgba(247,247,245,0.9)] px-8 backdrop-blur-[10px]">
					<div className="flex max-w-[520px] flex-1 items-center gap-[10px]">
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							width="18"
							height="18"
							className="flex-shrink-0 text-[#ccc]"
						>
							<circle cx="11" cy="11" r="7" />
							<path d="M21 21l-4.35-4.35" strokeLinecap="round" />
						</svg>
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search your memories..."
							className="flex-1 border-none bg-transparent p-0 font-serif text-[22px] font-light italic tracking-[-0.01em] text-[#aaa] outline-none placeholder:text-[#ccc] focus:text-[#333]"
							aria-label="Search notes"
						/>
					</div>
					<nav className="flex items-center gap-0.5">
						<button type="button" className={`${TAB_CLASS} bg-[#ebebeb] text-[#1a1a1a]`}>
							Everything
						</button>
						<button type="button" className={TAB_CLASS}>
							Spaces
						</button>
						<button type="button" className={TAB_CLASS}>
							Serendipity
						</button>
					</nav>
				</header>

				<main className="flex-1 p-[28px_32px]">
					<div className="columns-[260px] gap-4">
						<AddCard onAdd={addCard} />
						{cards.map((card) => {
							if (card.type === 'text')
								return (
									<TextCard
										key={card._id}
										card={card}
										onDelete={() => void deleteCard(card._id)}
									/>
								);
							if (card.type === 'image')
								return (
									<ImageCard
										key={card._id}
										card={card}
										onDelete={() => void deleteCard(card._id)}
									/>
								);
							if (card.type === 'voice')
								return (
									<VoiceCard
										key={card._id}
										card={card}
										onDelete={() => void deleteCard(card._id)}
									/>
								);
							return null;
						})}
					</div>
					{cards.length === 0 && search.trim() ? (
						<p className="p-[60px_24px] text-center text-[14px] italic text-[#bbb]">
							Nothing matches &quot;{search}&quot;
						</p>
					) : null}
				</main>
			</div>
		</div>
	);
}
