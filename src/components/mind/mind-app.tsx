import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import {
	BrainCircuit,
	LoaderCircle,
	Search,
	Sparkles,
	WandSparkles,
} from "lucide-react";
import {
	startTransition,
	useDeferredValue,
	useEffect,
	useEffectEvent,
	useState,
} from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AuthNav } from "../auth-nav";
import ThemeToggle from "../ThemeToggle";
import { AddCard } from "./add-card";
import { ImageCard, TextCard, VoiceCard } from "./mind-card-views";
import type { NewCardPayload } from "./types";

const DEFAULT_MIRROR_PROMPT =
	"Given everything in my notes, what should I focus on this week?";

const VIEW_OPTIONS = [
	{
		id: "all",
		label: "All Cards",
		description: "The full capture stream across every format.",
	},
	{
		id: "text",
		label: "Notes",
		description: "Typed thoughts, reminders, and rough drafts.",
	},
	{
		id: "image",
		label: "Images",
		description: "Saved screenshots, references, and visual scraps.",
	},
	{
		id: "voice",
		label: "Voice",
		description: "Recorded fragments with transcripts when available.",
	},
] as const;

type ViewMode = (typeof VIEW_OPTIONS)[number]["id"];

function matchesView(
	cardType: "text" | "image" | "voice",
	view: ViewMode,
): boolean {
	return view === "all" ? true : cardType === view;
}

export default function MindApp() {
	const searchState = useSearch({ from: "/" });
	const navigate = useNavigate({ from: "/" });
	const [draftQuery, setDraftQuery] = useState(searchState.q ?? "");
	const [mirrorOpen, setMirrorOpen] = useState(false);
	const [mirrorPrompt, setMirrorPrompt] = useState(DEFAULT_MIRROR_PROMPT);
	const [mirrorLoading, setMirrorLoading] = useState(false);
	const [mirrorReport, setMirrorReport] = useState("");
	const [mirrorErr, setMirrorErr] = useState("");
	const [mirrorMessage, setMirrorMessage] = useState("");
	const deferredQuery = useDeferredValue((searchState.q ?? "").trim());
	const currentView = (searchState.view ?? "all") as ViewMode;
	const cards = useQuery(
		api.mindCards.listCards,
		deferredQuery ? { search: deferredQuery } : {},
	);
	const createCard = useMutation(api.mindCards.createCard);
	const removeCard = useMutation(api.mindCards.deleteCard);
	const classifyCard = useAction(api.mindCards.classifyCard);
	const runMindMirror = useAction(api.mindMirror.runAnalysis);

	useEffect(() => {
		setMirrorOpen(searchState.panel === "mirror");
	}, [searchState.panel]);

	useEffect(() => {
		setDraftQuery(searchState.q ?? "");
	}, [searchState.q]);

	const commitSearch = useEffectEvent((nextValue: string) => {
		const nextTrimmed = nextValue.trim();
		startTransition(() => {
			void navigate({
				replace: true,
				search: (prev) => ({
					...prev,
					q: nextTrimmed ? nextValue : undefined,
				}),
			});
		});
	});

	useEffect(() => {
		if (draftQuery === (searchState.q ?? "")) {
			return;
		}

		const timeout = window.setTimeout(() => {
			commitSearch(draftQuery);
		}, 160);

		return () => window.clearTimeout(timeout);
	}, [draftQuery, searchState.q]);

	async function submitMindMirror() {
		const trimmed = mirrorPrompt.trim();
		if (trimmed.length < 4 || mirrorLoading) return;
		setMirrorLoading(true);
		setMirrorErr("");
		setMirrorMessage("Running Mind Mirror…");
		setMirrorReport("");
		try {
			const out = await runMindMirror({ request: trimmed });
			setMirrorReport(out.report);
			setMirrorMessage("Mind Mirror finished.");
		} catch (e) {
			setMirrorErr(e instanceof Error ? e.message : "Mind Mirror failed.");
			setMirrorMessage("");
		} finally {
			setMirrorLoading(false);
		}
	}

	async function addCard(partial: NewCardPayload) {
		const id = await createCard({
			type: partial.type,
			text: partial.text,
			imageData: partial.imageData,
			audioData: partial.audioData,
			audioDurationSeconds: partial.audioDuration,
		});
		void classifyCard({ id }).catch(() => {});
	}

	async function deleteCard(id: Id<"mindCards">) {
		const confirmed = window.confirm("Delete this card permanently?");
		if (!confirmed) return;
		await removeCard({ id });
	}

	function toggleMirrorPanel(nextOpen: boolean) {
		setMirrorOpen(nextOpen);
		startTransition(() => {
			void navigate({
				replace: true,
				search: (prev) => ({
					...prev,
					panel: nextOpen ? "mirror" : undefined,
				}),
			});
		});
	}

	if (cards === undefined) {
		return (
			<main
				id="main-content"
				className="mx-auto flex min-h-dvh w-full max-w-[1440px] items-center justify-center px-4 py-8 sm:px-6 lg:px-10"
			>
				<div className="app-panel flex items-center gap-3 px-5 py-4 text-[var(--ink-soft)]">
					<LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
					<span>Loading Cards…</span>
				</div>
			</main>
		);
	}

	const totalCount = cards.length;
	const pendingCount = cards.filter(
		(card) => card.autoCategoryState === "pending",
	).length;
	const readyCount = cards.filter(
		(card) => card.autoCategoryState === "ready",
	).length;
	const visibleCards = cards.filter((card) =>
		matchesView(card.type, currentView),
	);
	const counts: Record<ViewMode, number> = {
		all: cards.length,
		text: cards.filter((card) => card.type === "text").length,
		image: cards.filter((card) => card.type === "image").length,
		voice: cards.filter((card) => card.type === "voice").length,
	};
	const currentViewMeta =
		VIEW_OPTIONS.find((option) => option.id === currentView) ?? VIEW_OPTIONS[0];

	return (
		<main
			id="main-content"
			className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-10"
		>
			<div className="grid gap-6">
				<section className="app-panel overflow-hidden px-5 py-5 sm:px-6 lg:px-8 lg:py-7">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="space-y-4">
								<Link className="app-chip w-fit" to="/">
									<span className="app-icon-swatch">
										<BrainCircuit aria-hidden="true" className="size-4" />
									</span>
									<span className="text-sm font-semibold">mymind</span>
								</Link>
								<div className="space-y-3">
									<p className="section-kicker">Memory Dashboard</p>
									<h1 className="display-title max-w-4xl text-5xl text-[var(--ink)] sm:text-6xl">
										The working pile for everything worth keeping.
									</h1>
									<p className="max-w-3xl text-base leading-8 text-[var(--ink-soft)] sm:text-lg">
										Capture first. Organize later. Search across notes, voice
										transcripts, summaries, and tags from one private library.
									</p>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-2 lg:justify-end">
								<ThemeToggle />
								<AuthNav />
							</div>
						</div>

						<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
							<label
								className="app-subpanel flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5"
								htmlFor="card-search"
							>
								<span className="app-icon-swatch shrink-0">
									<Search aria-hidden="true" className="size-4" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="section-kicker mb-1 block">Search</span>
									<input
										id="card-search"
										name="card_search"
										autoComplete="off"
										className="w-full border-0 bg-transparent p-0 text-base outline-none placeholder:text-[var(--ink-faint)]"
										inputMode="search"
										onChange={(event) => {
											setDraftQuery(event.target.value);
										}}
										placeholder="Search notes, tags, and transcripts…"
										type="search"
										value={draftQuery}
									/>
								</span>
							</label>

							<div className="grid gap-3 sm:grid-cols-3">
								<div className="app-stat">
									<p className="section-kicker">Cards</p>
									<p className="app-stat-number mt-3 [font-variant-numeric:tabular-nums]">
										{totalCount}
									</p>
									<p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
										Items currently in the library.
									</p>
								</div>
								<div className="app-stat">
									<p className="section-kicker">Structured</p>
									<p className="app-stat-number mt-3 [font-variant-numeric:tabular-nums]">
										{readyCount}
									</p>
									<p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
										{pendingCount > 0
											? `${pendingCount} waiting in the queue.`
											: "No pending cards right now."}
									</p>
								</div>
								<button
									type="button"
									className="app-stat text-left transition-[background-color,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-[var(--edge-strong)]"
									onClick={() => toggleMirrorPanel(!mirrorOpen)}
								>
									<p className="section-kicker">Mind Mirror</p>
									<p className="mt-3 text-xl font-semibold text-[var(--ink)]">
										{mirrorOpen ? "Panel Open" : "Ask for Patterns"}
									</p>
									<p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
										Run a synthesis across the full card library.
									</p>
								</button>
							</div>
						</div>
					</div>
				</section>

				<div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
					<aside className="grid content-start gap-6 xl:sticky xl:top-4 xl:self-start">
						<AddCard onAdd={addCard} />

						<section className="app-panel overflow-hidden">
							<div className="border-b border-[var(--edge)] px-5 py-5 sm:px-6">
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="section-kicker">Mind Mirror</p>
										<h2 className="display-title mt-3 text-3xl text-[var(--ink)]">
											Ask the library what it sees.
										</h2>
									</div>
									<button
										type="button"
										className="app-button-secondary"
										onClick={() => toggleMirrorPanel(!mirrorOpen)}
									>
										{mirrorOpen ? "Hide Panel" : "Open Panel"}
									</button>
								</div>
							</div>

							<div className="px-5 py-5 sm:px-6 sm:py-6">
								{mirrorOpen ? (
									<form
										className="space-y-4"
										onSubmit={(event) => {
											event.preventDefault();
											void submitMindMirror();
										}}
									>
										<label className="grid gap-2" htmlFor="mind-mirror-request">
											<span className="text-sm font-semibold text-[var(--ink)]">
												Question
											</span>
											<textarea
												id="mind-mirror-request"
												name="mind_mirror_request"
												className="app-textarea"
												onChange={(event) =>
													setMirrorPrompt(event.target.value)
												}
												placeholder="What deserves attention this week…"
												rows={5}
												value={mirrorPrompt}
											/>
										</label>
										<div className="flex flex-wrap items-center justify-between gap-3">
											<p className="text-sm leading-7 text-[var(--ink-soft)]">
												Best with a focused question, not a vague prompt.
											</p>
											<button
												type="submit"
												className="app-button"
												disabled={
													mirrorPrompt.trim().length < 4 || mirrorLoading
												}
											>
												<WandSparkles aria-hidden="true" className="size-4" />
												{mirrorLoading ? "Running…" : "Run Mind Mirror"}
											</button>
										</div>

										{mirrorMessage ? (
											<p
												aria-live="polite"
												className="text-sm text-[var(--ink-soft)]"
											>
												{mirrorMessage}
											</p>
										) : null}

										{mirrorErr ? (
											<p
												aria-live="polite"
												className="rounded-[20px] border border-[color:rgba(155,50,33,0.18)] bg-[color:rgba(155,50,33,0.08)] px-4 py-3 text-sm text-[var(--danger)]"
												role="alert"
											>
												{mirrorErr}
											</p>
										) : null}

										{mirrorReport ? (
											<pre className="overflow-x-auto rounded-[24px] border border-[var(--edge)] bg-[var(--surface)] p-4 text-sm leading-7 text-[var(--ink)]">
												{mirrorReport}
											</pre>
										) : null}
									</form>
								) : (
									<p className="text-sm leading-7 text-[var(--ink-soft)]">
										Open the panel when you want a weekly synthesis, a pattern
										check, or a prioritization pass across everything you have
										saved.
									</p>
								)}
							</div>
						</section>
					</aside>

					<section className="app-panel overflow-hidden">
						<div className="border-b border-[var(--edge)] px-5 py-5 sm:px-6 lg:px-7">
							<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
								<div className="space-y-3">
									<p className="section-kicker">Library</p>
									<h2 className="display-title text-4xl text-[var(--ink)] sm:text-5xl">
										{currentViewMeta.label}
									</h2>
									<p className="max-w-2xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
										{deferredQuery
											? `Showing ${visibleCards.length} result${visibleCards.length === 1 ? "" : "s"} for “${deferredQuery}.”`
											: currentViewMeta.description}
									</p>
								</div>

								<div className="flex flex-wrap gap-2">
									{VIEW_OPTIONS.map((option) => (
										<Link
											key={option.id}
											className={`app-chip ${currentView === option.id ? "is-active" : ""}`}
											search={(prev) => ({
												...prev,
												view: option.id === "all" ? undefined : option.id,
											})}
											to="/"
										>
											<span className="font-semibold">{option.label}</span>
											<span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold [font-variant-numeric:tabular-nums]">
												{counts[option.id]}
											</span>
										</Link>
									))}
								</div>
							</div>
						</div>

						<div className="px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
							{visibleCards.length > 0 ? (
								<div className="memory-grid">
									{visibleCards.map((card) => {
										if (card.type === "text") {
											return (
												<TextCard
													key={card._id}
													card={card}
													onDelete={() => void deleteCard(card._id)}
												/>
											);
										}
										if (card.type === "image") {
											return (
												<ImageCard
													key={card._id}
													card={card}
													onDelete={() => void deleteCard(card._id)}
												/>
											);
										}
										if (card.type === "voice") {
											return (
												<VoiceCard
													key={card._id}
													card={card}
													onDelete={() => void deleteCard(card._id)}
												/>
											);
										}
										return null;
									})}
								</div>
							) : (
								<div className="rounded-[26px] border border-dashed border-[var(--edge)] bg-[var(--surface)] px-6 py-12 text-center">
									<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent-strong)]">
										<Sparkles aria-hidden="true" className="size-6" />
									</div>
									<p className="display-title text-3xl text-[var(--ink)]">
										Nothing to show yet.
									</p>
									<p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
										{deferredQuery
											? `No cards match “${deferredQuery}.” Try a simpler search or switch views.`
											: `No ${currentView === "all" ? "cards" : currentViewMeta.label.toLowerCase()} yet. Capture something from the panel on the left and it will appear here.`}
									</p>
								</div>
							)}
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}
