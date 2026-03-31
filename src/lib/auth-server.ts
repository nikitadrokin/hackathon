import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;

if (typeof convexUrl !== "string" || convexUrl.length === 0) {
	throw new Error("VITE_CONVEX_URL must be set");
}
if (typeof convexSiteUrl !== "string" || convexSiteUrl.length === 0) {
	throw new Error("VITE_CONVEX_SITE_URL must be set");
}

export const {
	handler,
	getToken,
	fetchAuthQuery,
	fetchAuthMutation,
	fetchAuthAction,
} = convexBetterAuthReactStart({
	convexUrl,
	convexSiteUrl,
});
