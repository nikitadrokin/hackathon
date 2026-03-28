import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
	handler,
	preloadAuthQuery,
	isAuthenticated,
	getToken,
	fetchAuthQuery,
	fetchAuthMutation,
	fetchAuthAction,
} = convexBetterAuthNextJs({
	convexUrl: process.env.VITE_CONVEX_URL!,
	convexSiteUrl: process.env.VITE_CONVEX_SITE_URL!,
});
