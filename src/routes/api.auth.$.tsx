import { createFileRoute } from "@tanstack/react-router";

async function authHandler({ request }: { request: Request }) {
	const { handler } = await import("@/lib/auth-server");
	return handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: authHandler,
			POST: authHandler,
		},
	},
});
