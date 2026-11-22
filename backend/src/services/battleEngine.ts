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
	// 0 rolls full damage, so a constant 0 source means "always hits, max damage"
	const roll = 1 - 0.15 * random()

	const multiplier = typeMultiplier(defender, move.type)
	if (multiplier === 0) return 0

	const base = ((2 * LEVEL / 5 + 2) * move.power * attack / defense) / 50 + 2
	// A hit that lands always hurts: 0 damage stays the mark of an immune defender
	return Math.max(1, Math.floor(base * stab * multiplier * roll))
}

export interface Fighter {
	pokemon: Pokemon
	hp: number
	maxHp: number
	moves: BattleMove[]
}

type Side = 0 | 1

export interface BattleState {
	fighters: [Fighter, Fighter]
	round: number
	winner?: Side
}

export interface BattleAction {
	attacker: Side
	move: string
	hit: boolean
	damage: number
	ko: boolean
}

export interface RoundResult {
	round: number
	actions: BattleAction[]
	hp: [number, number]
	winner?: Side
}

export const createFighter = (pokemon: Pokemon, moves: BattleMove[]): Fighter => {
	const hp = maxHp(pokemon)
	return { pokemon, hp, maxHp: hp, moves }
}

const turnOrder = ([first, second]: [Fighter, Fighter], random: RandomSource): [Side, Side] => {
	const speedGap = first.pokemon.stats.speed - second.pokemon.stats.speed
	const firstGoesFirst = speedGap === 0 ? random() < 0.5 : speedGap > 0
	return firstGoesFirst ? [0, 1] : [1, 0]
}

/** Play one round: both Pokémon use their move in speed order, until one of them is KO */
export const resolveRound = (
	state: BattleState,
	moves: [BattleMove, BattleMove],
	random: RandomSource
): { state: BattleState, result: RoundResult } => {
	const fighters: [Fighter, Fighter] = [{ ...state.fighters[0] }, { ...state.fighters[1] }]
	const actions: BattleAction[] = []
	let winner: Side | undefined

	for (const attacker of turnOrder(fighters, random)) {
		if (winner !== undefined) break
		const defender: Side = attacker === 0 ? 1 : 0
		const move = moves[attacker]

		const hit = move.accuracy === null || random() * 100 < move.accuracy
		const damage = hit ? computeDamage(fighters[attacker].pokemon, fighters[defender].pokemon, move, random) : 0
		fighters[defender].hp = Math.max(0, fighters[defender].hp - damage)

		const ko = fighters[defender].hp === 0
		if (ko) winner = attacker
		actions.push({ attacker, move: move.name, hit, damage, ko })
	}

	const round = state.round + 1
	const hp: [number, number] = [fighters[0].hp, fighters[1].hp]
	return {
		state: { fighters, round, ...(winner !== undefined && { winner }) },
		result: { round, actions, hp, ...(winner !== undefined && { winner }) }
	}
}
