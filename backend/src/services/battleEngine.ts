import type { Pokemon } from '../types/pokemon.ts'

export interface BattleMove {
	name: string
	power: number
	type: string
	/** `null` for moves that never miss */
	accuracy: number | null
	damageClass: 'physical' | 'special'
}

/** A number in [0, 1), like `Math.random`: injected so battles are reproducible in tests */
export type RandomSource = () => number

const LEVEL = 50
const STAB = 1.5

/** The level 50 HP stat, without IVs or EVs */
export const maxHp = (pokemon: Pokemon): number => Math.floor((2 * pokemon.stats.HP * LEVEL) / 100) + LEVEL + 10

const typeMultiplier = (defender: Pokemon, moveType: string): number =>
	defender.apiResistances.find(r => r.name === moveType)?.damage_multiplier ?? 1

export const computeDamage = (attacker: Pokemon, defender: Pokemon, move: BattleMove, random: RandomSource): number => {
	const [attack, defense] = move.damageClass === 'special'
		? [attacker.stats.special_attack, defender.stats.special_defense]
		: [attacker.stats.attack, defender.stats.defense]
	const stab = attacker.apiTypes.some(t => t.name === move.type) ? STAB : 1
	const roll = 0.85 + 0.15 * random()

	const base = ((2 * LEVEL / 5 + 2) * move.power * attack / defense) / 50 + 2
	return Math.floor(base * stab * typeMultiplier(defender, move.type) * roll)
}
