import { resolve as resolvePath } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { type ConfigEnv, defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const clientNodeShimsPlugin: Plugin = {
	name: "tanstack-client-node-shims",
	enforce: "pre",
	apply: "build",
	config(_config: unknown, env: ConfigEnv) {
		if (env.isSsrBuild) {
			return;
		}

		return {
			resolve: {
				alias: [
					{
						find: /^node:stream\/web$/,
						replacement: resolvePath(
							process.cwd(),
							"src/shims/node-stream-web.ts",
						),
					},
					{
						find: /^stream\/web$/,
						replacement: resolvePath(
							process.cwd(),
							"src/shims/node-stream-web.ts",
						),
					},
					{
						find: /^node:stream$/,
						replacement: resolvePath(process.cwd(), "src/shims/node-stream.ts"),
					},
					{
						find: /^stream$/,
						replacement: resolvePath(process.cwd(), "src/shims/node-stream.ts"),
					},
					{
						find: /^node:async_hooks$/,
						replacement: resolvePath(
							process.cwd(),
							"src/shims/node-async-hooks.ts",
						),
					},
				],
			},
		};
	},
};

const config = defineConfig({
	optimizeDeps: {
		exclude: ["@xenova/transformers"],
	},
	plugins: [
		clientNodeShimsPlugin,
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart(),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		nitro({ preset: "bun" }),
	],
});

export default config;
