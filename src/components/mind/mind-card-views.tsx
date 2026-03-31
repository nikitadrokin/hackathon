import { Image as ImageIcon, Mic, NotebookPen, Trash2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useRef, useState } from "react";
import { formatTime } from "./format-time";
import type { MindCardDoc } from "./types";

const CARD_STYLE: CSSProperties = {
	contentVisibility: "auto",
	containIntrinsicSize: "320px",
};

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	year: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
	hour: "numeric",
	minute: "2-digit",
});

function CardInsights({ card }: { card: MindCardDoc }) {
	if (card.autoCategoryState === "pending") {
		return (
			<p className="mt-5 rounded-[18px] border border-[var(--edge)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-soft)]">
				Structuring…
			</p>
		);
	}
	if (card.autoCategoryState === "failed") {
		return (
			<p className="mt-5 rounded-[18px] border border-[color:rgba(168,91,8,0.18)] bg-[color:rgba(168,91,8,0.08)] px-4 py-3 text-sm text-[var(--warning)]">
				{card.autoCategoryReason ?? "Could not auto-structure."}
			</p>
		);
	}
	if (card.autoCategoryState !== "ready") return null;
	return (
		<div className="mt-5 space-y-3 border-t border-[var(--edge)] pt-4">
			{card.autoSummary ? (
				<p className="text-sm leading-7 text-[var(--ink-soft)]">
					{card.autoSummary}
				</p>
			) : null}
			<div className="flex flex-wrap gap-1">
				{card.autoCategory ? (
					<span className="app-chip min-h-0 border-transparent bg-[var(--accent-muted)] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
						{card.autoCategory}
					</span>
				) : null}
				{card.autoTags.slice(0, 6).map((tag) => (
					<span
						key={tag}
						className="app-chip min-h-0 px-3 py-1 text-[0.72rem] font-semibold"
					>
						{tag}
					</span>
				))}
			</div>
		</div>
	);
}

function CardFrame({
	card,
	icon,
	label,
	onDelete,
	children,
}: {
	card: MindCardDoc;
	icon: ReactNode;
	label: string;
	onDelete: () => void;
	children: ReactNode;
}) {
	const heading = card.title?.trim() || label;

	return (
		<article
			className="memory-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--edge-strong)]"
			style={CARD_STYLE}
		>
			<div className="p-5 sm:p-6">
				<header className="flex items-start justify-between gap-4">
					<div className="min-w-0 space-y-3">
						<span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--edge)] bg-[var(--chip)] px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
							{icon}
							{label}
						</span>
						<div className="min-w-0 space-y-1">
							<h3 className="text-lg font-semibold text-[var(--ink)]">
								{heading}
							</h3>
							<p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
								{DATE_FORMATTER.format(card.createdAt)} ·{" "}
								{TIME_FORMATTER.format(card.createdAt)}
							</p>
						</div>
					</div>
					<button
						type="button"
						className="card-delete"
						onClick={onDelete}
						aria-label={`Delete ${label.toLowerCase()} card`}
					>
						<Trash2 aria-hidden="true" className="size-4" />
					</button>
				</header>

				<div className="mt-5">{children}</div>
				<CardInsights card={card} />
			</div>
		</article>
	);
}

export function TextCard({
	card,
	onDelete,
}: {
	card: MindCardDoc;
	onDelete: () => void;
}) {
	return (
		<CardFrame
			card={card}
			icon={<NotebookPen aria-hidden="true" className="size-3.5" />}
			label="Text Note"
			onDelete={onDelete}
		>
			<p className="whitespace-pre-wrap break-words text-[0.96rem] leading-8 text-[var(--ink)]">
				{card.text}
			</p>
		</CardFrame>
	);
}

export function ImageCard({
	card,
	onDelete,
}: {
	card: MindCardDoc;
	onDelete: () => void;
}) {
	const src = card.imageData ?? "";
	return (
		<CardFrame
			card={card}
			icon={<ImageIcon aria-hidden="true" className="size-3.5" />}
			label="Image"
			onDelete={onDelete}
		>
			{src ? (
				<img
					alt={card.title?.trim() || card.autoSummary || "Saved image"}
					className="w-full rounded-[22px] border border-[var(--edge)] bg-[var(--surface)] object-cover"
					decoding="async"
					loading="lazy"
					src={src}
				/>
			) : (
				<p className="text-sm text-[var(--ink-soft)]">
					Image preview unavailable.
				</p>
			)}
		</CardFrame>
	);
}

export function VoiceCard({
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
	const src = card.audioData ?? "";

	return (
		<CardFrame
			card={card}
			icon={<Mic aria-hidden="true" className="size-3.5" />}
			label="Voice"
			onDelete={onDelete}
		>
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
				<track kind="captions" label="Voice transcript" />
			</audio>
			<div className="rounded-[22px] border border-[var(--edge)] bg-[var(--surface)] p-4">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={toggle}
						className="app-button-secondary h-11 w-11 rounded-full p-0"
						aria-label={playing ? "Pause" : "Play"}
					>
						{playing ? (
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="currentColor"
								width="14"
								height="14"
							>
								<rect x="5" y="3" width="5" height="18" rx="1" />
								<rect x="14" y="3" width="5" height="18" rx="1" />
							</svg>
						) : (
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="currentColor"
								width="14"
								height="14"
							>
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
									className="wave-bar"
									style={{
										height: `${h}px`,
										background: active
											? "var(--accent)"
											: "color-mix(in oklab, var(--edge) 85%, white 15%)",
									}}
								/>
							);
						})}
					</div>
					<span className="flex-shrink-0 text-xs text-[var(--ink-faint)] [font-variant-numeric:tabular-nums]">
						{duration > 0 ? formatTime(duration) : formatTime(currentTime)}
					</span>
				</div>
			</div>
			{card.text?.trim() ? (
				<p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--ink-soft)]">
					{card.text}
				</p>
			) : null}
		</CardFrame>
	);
}
