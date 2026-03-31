import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { ConvexClientProvider } from "#/components/convex-client-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	token?: string | null;
	isAuthenticated?: boolean;
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		if (!import.meta.env.SSR) {
			return {
				token: undefined,
				isAuthenticated: undefined,
			};
		}

		const { getToken } = await import("@/lib/auth-server");
		const token = await getToken();
		return {
			token,
			isAuthenticated: Boolean(token),
		};
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "mymind" },
			{
				name: "description",
				content:
					"Capture text, images, and voice notes in one private memory studio.",
			},
			{ name: "theme-color", content: "#f5efe3" },
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { token } = Route.useRouteContext();

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/** biome-ignore lint/security/noDangerouslySetInnerHtml: theme */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere]">
				<a className="skip-link" href="#main-content">
					Skip to Content
				</a>
				<ConvexClientProvider initialToken={token}>
					{children}
				</ConvexClientProvider>
				<Scripts />
			</body>
		</html>
	);
}
