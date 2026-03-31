import { Monitor, MoonStar, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "auto";

const THEME_COPY: Record<
	ThemeMode,
	{ icon: typeof Sun; label: string; next: ThemeMode }
> = {
	auto: { icon: Monitor, label: "Theme: System", next: "light" },
	light: { icon: Sun, label: "Theme: Light", next: "dark" },
	dark: { icon: MoonStar, label: "Theme: Dark", next: "auto" },
};

function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") {
		return "auto";
	}

	const stored = window.localStorage.getItem("theme");
	if (stored === "light" || stored === "dark" || stored === "auto") {
		return stored;
	}

	return "auto";
}

function applyThemeMode(mode: ThemeMode) {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;

	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);

	if (mode === "auto") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.setAttribute("data-theme", mode);
	}

	document.documentElement.style.colorScheme = resolved;
}

export default function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>("auto");

	useEffect(() => {
		const initialMode = getInitialMode();
		setMode(initialMode);
		applyThemeMode(initialMode);
	}, []);

	useEffect(() => {
		if (mode !== "auto") {
			return;
		}

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyThemeMode("auto");

		media.addEventListener("change", onChange);
		return () => {
			media.removeEventListener("change", onChange);
		};
	}, [mode]);

	function toggleMode() {
		const nextMode = THEME_COPY[mode].next;
		setMode(nextMode);
		applyThemeMode(nextMode);
		window.localStorage.setItem("theme", nextMode);
	}

	const { icon: Icon, label } = THEME_COPY[mode];

	return (
		<button
			type="button"
			onClick={toggleMode}
			aria-label={`${label}. Click to switch modes.`}
			className="app-chip"
			title={`${label}. Click to switch modes.`}
		>
			<span className="app-icon-swatch">
				<Icon aria-hidden="true" className="size-4" />
			</span>
			<span className="text-sm font-semibold">{label}</span>
		</button>
	);
}
