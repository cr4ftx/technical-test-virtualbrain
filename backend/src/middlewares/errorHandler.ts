import { isAxiosError } from 'axios'
import type { ErrorRequestHandler } from 'express'
import { HttpError } from '../errors.ts'

/**
 * Last middleware: turns thrown errors into JSON responses.
 * Express 5 forwards rejected promises from async handlers here.
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
	if (err instanceof HttpError) {
		res.status(err.status).json({ error: err.message })
		return
	}

	if (isAxiosError(err)) {
		const upstreamStatus = err.response?.status
		if (upstreamStatus === 404) {
			res.status(404).json({ error: 'Not found' })
			return
		}
		console.error('Upstream error:', err.config?.url, upstreamStatus ?? err.code)
		res.status(502).json({ error: 'Upstream service unavailable' })
		return
	}

	console.error(err)
	res.status(500).json({ error: 'Internal server error' })
}
