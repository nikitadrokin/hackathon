import { createReadStream } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const clientDir = resolve(rootDir, 'dist/client')
const serverEntryUrl = new URL('./dist/server/server.js', import.meta.url)

let app

try {
	const serverEntry = await import(serverEntryUrl.href)
	app = serverEntry.default
} catch (error) {
	console.error('Failed to load the built server bundle at dist/server/server.js.')
	console.error('Run `bun run build` before starting the production server.')
	throw error
}

if (!app || typeof app.fetch !== 'function') {
	throw new Error('The built server bundle does not export a default fetch handler.')
}

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

const contentTypes = new Map([
	['.css', 'text/css; charset=utf-8'],
	['.html', 'text/html; charset=utf-8'],
	['.ico', 'image/x-icon'],
	['.js', 'text/javascript; charset=utf-8'],
	['.json', 'application/json; charset=utf-8'],
	['.mjs', 'text/javascript; charset=utf-8'],
	['.png', 'image/png'],
	['.svg', 'image/svg+xml'],
	['.txt', 'text/plain; charset=utf-8'],
	['.webmanifest', 'application/manifest+json; charset=utf-8'],
	['.woff', 'font/woff'],
	['.woff2', 'font/woff2'],
])

function isInsideDirectory(filePath, directory) {
	return filePath === directory || filePath.startsWith(`${directory}${sep}`)
}

async function getStaticFile(pathname) {
	if (pathname === '/') {
		return null
	}

	let decodedPathname

	try {
		decodedPathname = decodeURIComponent(pathname)
	} catch {
		return null
	}

	const filePath = resolve(clientDir, `.${decodedPathname}`)
	if (!isInsideDirectory(filePath, clientDir)) {
		return null
	}

	try {
		await access(filePath)
		const fileStats = await stat(filePath)
		if (!fileStats.isFile()) {
			return null
		}

		return filePath
	} catch {
		return null
	}
}

function applyResponseHeaders(response, res) {
	const setCookies =
		typeof response.headers.getSetCookie === 'function'
			? response.headers.getSetCookie()
			: []

	if (setCookies.length > 0) {
		res.setHeader('set-cookie', setCookies)
	}

	response.headers.forEach((value, key) => {
		if (key === 'set-cookie') {
			return
		}

		res.setHeader(key, value)
	})
}

function createWebRequest(req, pathname) {
	const headers = new Headers()

	for (const [key, value] of Object.entries(req.headers)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				headers.append(key, item)
			}
			continue
		}

		if (typeof value === 'string') {
			headers.set(key, value)
		}
	}

	const origin = `http://${req.headers.host ?? `${host}:${port}`}`
	const url = new URL(pathname, origin)
	const method = req.method ?? 'GET'

	if (method === 'GET' || method === 'HEAD') {
		return new Request(url, { headers, method })
	}

	return new Request(url, {
		body: Readable.toWeb(req),
		duplex: 'half',
		headers,
		method,
	})
}

const server = createServer(async (req, res) => {
	const pathname = req.url ?? '/'
	const url = new URL(pathname, `http://${req.headers.host ?? `${host}:${port}`}`)
	const staticFile = await getStaticFile(url.pathname)

	if (staticFile) {
		const extension = extname(staticFile).toLowerCase()
		const contentType =
			contentTypes.get(extension) ?? 'application/octet-stream'

		res.statusCode = 200
		res.setHeader('content-type', contentType)
		if (url.pathname.startsWith('/assets/')) {
			res.setHeader('cache-control', 'public, max-age=31536000, immutable')
		}

		try {
			await pipeline(createReadStream(staticFile), res)
		} catch (error) {
			console.error('Failed to stream static asset:', staticFile, error)
			if (!res.headersSent) {
				res.statusCode = 500
				res.end('Internal Server Error')
			}
		}
		return
	}

	try {
		const request = createWebRequest(req, pathname)
		const response = await app.fetch(request)

		res.statusCode = response.status
		applyResponseHeaders(response, res)

		if (!response.body || req.method === 'HEAD') {
			res.end()
			return
		}

		await pipeline(Readable.fromWeb(response.body), res)
	} catch (error) {
		console.error('Unhandled server error:', error)
		if (!res.headersSent) {
			res.statusCode = 500
			res.setHeader('content-type', 'text/plain; charset=utf-8')
		}
		res.end('Internal Server Error')
	}
})

server.listen(port, host, () => {
	console.log(`mymind server listening on http://${host}:${port}`)
})
