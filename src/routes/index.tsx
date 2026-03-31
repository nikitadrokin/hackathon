import { createFileRoute, redirect } from "@tanstack/react-router";
import MindApp from "#/components/mind-app";

type HomeSearch = {
	q?: string;
	view?: "all" | "text" | "image" | "voice";
	panel?: "mirror";
};

function validateSearch(search: Record<string, unknown>): HomeSearch {
	return {
		q:
			typeof search.q === "string" && search.q.length > 0
				? search.q
				: undefined,
		view:
			search.view === "text" ||
			search.view === "image" ||
			search.view === "voice"
				? search.view
				: "all",
		panel: search.panel === "mirror" ? "mirror" : undefined,
	};
}

export const Route = createFileRoute("/")({
	validateSearch,
	beforeLoad: ({ context }) => {
		if (context.isAuthenticated === false) {
			throw redirect({ to: "/login" });
		}
	},
	component: MindApp,
});
