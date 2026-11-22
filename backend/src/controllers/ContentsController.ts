import { type Request, type Response, Router } from 'express'

const ContentController = Router()

/**
 * Save all pokemon as markdown in the export folder
 * @route GET /contents/all
 * @group Contents
 */
ContentController.get(
	'/all',
	async (_req: Request, res: Response) => {
		res.sendStatus(501)
	}
)

/**
 * Return a pokemon as markdown
 * @route GET /contents/:pokemonId
 * @group Contents
 * @param {number} pokemonId.path.required - Pokemon ID
 */
ContentController.get(
	'/:pokemonId',
	async (_req: Request<{ pokemonId: string }>, res: Response) => {
		res.sendStatus(501)
	}
)

export { ContentController }
