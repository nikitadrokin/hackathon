import { Link } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function getInitials(value: string): string {
	const parts = value
		.split(/\s+/)
		.map((part) => part.trim())
		.filter(Boolean)
		.slice(0, 2);

	if (parts.length === 0) {
		return "MM";
	}

	return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function AuthNav() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<p
				aria-live="polite"
				className="text-sm font-medium text-[var(--ink-soft)]"
			>
				Checking Session…
			</p>
		);
	}

	if (session?.user) {
		const label = session.user.name?.trim() || session.user.email || "Account";

		return (
			<div className="flex flex-wrap items-center justify-end gap-2">
				<div className="app-chip min-w-0 max-w-full pr-4">
					<span
						aria-hidden="true"
						className="flex size-8 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[0.75rem] font-bold text-[var(--accent-strong)]"
					>
						{getInitials(label)}
					</span>
					<span className="flex min-w-0 items-center gap-2">
						<UserRound
							aria-hidden="true"
							className="size-4 text-[var(--ink-faint)]"
						/>
						<span className="max-w-[12rem] truncate">{label}</span>
					</span>
				</div>
				<button
					type="button"
					className="app-button-secondary"
					onClick={() => {
						void authClient.signOut();
					}}
				>
					<LogOut aria-hidden="true" className="size-4" />
					Sign Out
				</button>
			</div>
		);
	}

	return (
		<Link className="app-button-secondary" to="/login">
			Sign In
		</Link>
	);
}
