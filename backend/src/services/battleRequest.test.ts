import { describe, expect, it } from 'vitest'
import { HttpError } from '../errors.ts'
import { parseBattleRequest } from './battleRequest.ts'

describe('parseBattleRequest', () => {
	it('defaults to a one-shot battle', () => {
		expect(parseBattleRequest({ pokemonIds: [25, 7] })).toEqual({ pokemonIds: [25, 7], mode: 'one-shot' })
	})

	it('reads the battle mode', () => {
		expect(parseBattleRequest({ pokemonIds: [25, 7], mode: 'turn-based' })).toEqual({ pokemonIds: [25, 7], mode: 'turn-based' })
		expect(parseBattleRequest({ pokemonIds: [25, 7], mode: 'one-shot' })).toEqual({ pokemonIds: [25, 7], mode: 'one-shot' })
	})

	it.each([
		['no body', undefined],
		['a non-object body', 'pikachu'],
		['missing ids', {}],
		['ids not in an array', { pokemonIds: 25 }],
		['a single id', { pokemonIds: [25] }],
		['three ids', { pokemonIds: [1, 2, 3] }],
		['an id as a string', { pokemonIds: ['25', 7] }],
		['a fractional id', { pokemonIds: [2.5, 7] }],
		['id 0', { pokemonIds: [0, 7] }],
		['an id past generation 8', { pokemonIds: [25, 899] }],
		['an unknown mode', { pokemonIds: [25, 7], mode: 'best-of-3' }]
	])('rejects %s with a 400', (_, body) => {
		expect(() => parseBattleRequest(body)).toThrow(HttpError)
		expect(() => parseBattleRequest(body)).toThrow(expect.objectContaining({ status: 400 }))
	})
})
