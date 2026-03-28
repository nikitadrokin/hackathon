import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const clientNodeShimsPlugin = {
	name: 'tanstack-client-node-shims',
	enforce: 'pre',
	apply: 'build',
	config(_config, env) {
		if (env.isSsrBuild) {
			return
		}

		return {
			resolve: {
				alias: {
					'node:stream': new URL('./src/shims/node-stream.ts', import.meta.url)
						.pathname,
					'stream': new URL('./src/shims/node-stream.ts', import.meta.url)
						.pathname,
					'node:stream/web': new URL(
						'./src/shims/node-stream-web.ts',
						import.meta.url,
					).pathname,
					'stream/web': new URL('./src/shims/node-stream-web.ts', import.meta.url)
						.pathname,
					'node:async_hooks': new URL(
						'./src/shims/node-async-hooks.ts',
						import.meta.url,
					).pathname,
				},
			},
		}
	},
}

const config = defineConfig({
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  plugins: [
		clientNodeShimsPlugin,
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})

export default config
