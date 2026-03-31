import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
	ArrowRight,
	ImageIcon,
	Mic,
	NotebookPen,
	Sparkles,
} from "lucide-react";
import { startTransition, useState } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	beforeLoad: ({ context }) => {
		if (context.isAuthenticated === true) {
			throw redirect({ to: "/" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			if (mode === "signup") {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name.trim() || email.split("@")[0] || "User",
				});
				if (err) {
					setError(err.message ?? "Could not create account.");
					return;
				}
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password,
				});
				if (err) {
					setError(err.message ?? "Could not sign in.");
					return;
				}
			}
			startTransition(() => {
				void navigate({ to: "/" });
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<main
			id="main-content"
			className="mx-auto flex min-h-dvh w-full max-w-[1440px] items-center px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-10"
		>
			<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,460px)]">
				<section className="app-panel relative overflow-hidden px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
					<div className="relative z-10 flex h-full flex-col justify-between gap-8">
						<div className="space-y-5">
							<div className="app-chip w-fit">
								<span className="app-icon-swatch">
									<Sparkles aria-hidden="true" className="size-4" />
								</span>
								<span className="text-sm font-semibold">mymind</span>
							</div>
							<div className="space-y-4">
								<p className="section-kicker">Private Memory Studio</p>
								<h1 className="display-title max-w-3xl text-5xl text-[var(--ink)] sm:text-6xl">
									A cleaner home for thoughts that would otherwise disappear.
								</h1>
								<p className="max-w-2xl text-base leading-8 text-[var(--ink-soft)] sm:text-lg">
									Capture notes, screenshots, and voice fragments in one place,
									then use Mind Mirror to spot themes, summarize noise, and pull
									the useful threads back into focus.
								</p>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<div className="app-stat">
								<div className="app-icon-swatch mb-4">
									<NotebookPen aria-hidden="true" className="size-4" />
								</div>
								<p className="mb-2 text-lg font-semibold">Text Notes</p>
								<p className="text-sm leading-7 text-[var(--ink-soft)]">
									Drop in half-finished ideas before they evaporate.
								</p>
							</div>
							<div className="app-stat">
								<div className="app-icon-swatch mb-4">
									<ImageIcon aria-hidden="true" className="size-4" />
								</div>
								<p className="mb-2 text-lg font-semibold">Visual References</p>
								<p className="text-sm leading-7 text-[var(--ink-soft)]">
									Keep screenshots, sketches, and found images in the same flow.
								</p>
							</div>
							<div className="app-stat">
								<div className="app-icon-swatch mb-4">
									<Mic aria-hidden="true" className="size-4" />
								</div>
								<p className="mb-2 text-lg font-semibold">Voice Capture</p>
								<p className="text-sm leading-7 text-[var(--ink-soft)]">
									Record quickly, transcribe locally, and save the useful part.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section className="app-panel px-6 py-6 sm:px-8 sm:py-8">
					<p className="section-kicker">
						{mode === "signin" ? "Welcome Back" : "Create Account"}
					</p>
					<h2 className="display-title mt-4 text-4xl text-[var(--ink)]">
						{mode === "signin"
							? "Sign In to Continue"
							: "Start a New Memory Library"}
					</h2>
					<p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
						Use email & password authentication backed by Better Auth and
						Convex.
					</p>

					<div className="mt-6 flex gap-2 rounded-full border border-[var(--edge)] bg-[var(--surface)] p-1">
						<button
							type="button"
							className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-150 ${
								mode === "signin"
									? "bg-[var(--ink)] text-white"
									: "text-[var(--ink-soft)] hover:text-[var(--ink)]"
							}`}
							onClick={() => {
								setMode("signin");
								setError(null);
							}}
						>
							Sign In
						</button>
						<button
							type="button"
							className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-150 ${
								mode === "signup"
									? "bg-[var(--ink)] text-white"
									: "text-[var(--ink-soft)] hover:text-[var(--ink)]"
							}`}
							onClick={() => {
								setMode("signup");
								setError(null);
							}}
						>
							Create Account
						</button>
					</div>

					<form className="mt-6 space-y-4" onSubmit={onSubmit}>
						{mode === "signup" ? (
							<label className="grid gap-2" htmlFor="name">
								<span className="text-sm font-semibold text-[var(--ink)]">
									Name
								</span>
								<input
									id="name"
									name="name"
									autoComplete="name"
									className="app-input"
									onChange={(event) => {
										setName(event.target.value);
									}}
									placeholder="Morgan Lee…"
									value={name}
								/>
							</label>
						) : null}

						<label className="grid gap-2" htmlFor="email">
							<span className="text-sm font-semibold text-[var(--ink)]">
								Email
							</span>
							<input
								id="email"
								name="email"
								autoComplete="email"
								className="app-input"
								onChange={(event) => {
									setEmail(event.target.value);
								}}
								placeholder="you@example.com…"
								required
								spellCheck={false}
								type="email"
								value={email}
							/>
						</label>

						<label className="grid gap-2" htmlFor="password">
							<span className="text-sm font-semibold text-[var(--ink)]">
								Password
							</span>
							<input
								id="password"
								name="password"
								autoComplete={
									mode === "signin" ? "current-password" : "new-password"
								}
								className="app-input"
								minLength={8}
								onChange={(event) => {
									setPassword(event.target.value);
								}}
								placeholder="At least 8 characters…"
								required
								type="password"
								value={password}
							/>
						</label>

						{error ? (
							<p
								aria-live="polite"
								className="rounded-[20px] border border-[color:rgba(160,55,31,0.18)] bg-[color:rgba(160,55,31,0.08)] px-4 py-3 text-sm text-[var(--danger)]"
								role="alert"
							>
								{error}
							</p>
						) : null}

						<button
							className="app-button mt-2 w-full"
							disabled={loading}
							type="submit"
						>
							<span>
								{loading
									? "Please Wait…"
									: mode === "signin"
										? "Sign In"
										: "Create Account"}
							</span>
							<ArrowRight aria-hidden="true" className="size-4" />
						</button>
					</form>
				</section>
			</div>
		</main>
	);
}
