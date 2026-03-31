import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Public site URL for Better Auth API calls (same origin as the app in the browser).
 */
function getSiteUrl(): string {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	const fromEnv = import.meta.env.VITE_SITE_URL;
	if (typeof fromEnv === "string" && fromEnv.length > 0) {
		return fromEnv;
	}
	return "http://localhost:3000";
}

export const authClient = createAuthClient({
	baseURL: getSiteUrl(),
	plugins: [convexClient()],
});
