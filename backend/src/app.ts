import cors from 'cors'
import express from 'express'

import { ContentController } from './controllers/ContentsController.ts'
import { PokemonController } from './controllers/PokemonController.ts'
import { errorHandler } from './middlewares/errorHandler.ts'

const PORT = Number(process.env.PORT ?? 3001)

const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: process.env.CORS_ORIGIN ?? true }))
app.use(express.json({ limit: '100kb' }))

/**
 * Routes
 */
app.get('/ping', (_req, res) => {
	res.status(200).send('pong')
})
app.use('/pokemons', PokemonController)
app.use('/contents', ContentController)

app.use((_req, res) => {
	res.status(404).json({ error: 'Route not found' })
})
app.use(errorHandler)

app.listen(PORT, () => {
	console.log(`Server started on http://localhost:${PORT}`)
})
