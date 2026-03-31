import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (typeof convexUrl !== "string" || convexUrl.length === 0) {
	throw new Error("VITE_CONVEX_URL must be set");
}

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({
	children,
	initialToken,
}: {
	children: React.ReactNode;
	initialToken?: string | null;
}) {
	return (
		<ConvexBetterAuthProvider
			client={convex}
			authClient={authClient}
			initialToken={initialToken}
		>
			{children}
		</ConvexBetterAuthProvider>
	);
}
