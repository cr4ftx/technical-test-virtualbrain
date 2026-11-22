import cors from 'cors'
import express from 'express'

import { BattleController } from './controllers/BattleController.ts'
import { ContentController } from './controllers/ContentsController.ts'
import { PokemonController } from './controllers/PokemonController.ts'
import { errorHandler } from './middlewares/errorHandler.ts'
import { pokedex } from './services/pokedex.ts'

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
app.use('/battles', BattleController)

app.use((_req, res) => {
	res.status(404).json({ error: 'Route not found' })
})
app.use(errorHandler)

app.listen(PORT, () => {
	console.log(`Server started on http://localhost:${PORT}`)
})

// Warm up in the background: a cold build takes a minute or two, a failed one is retried by the next request
pokedex.load().then(
	pokemons => console.log(`Pokédex ready: ${pokemons.length} pokemons`),
	(error: unknown) => console.error('Pokédex build failed:', error instanceof Error ? error.message : error)
)
