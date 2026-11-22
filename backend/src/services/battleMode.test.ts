import { describe, expect, it } from 'vitest'
import { parseBattleMode } from './battleMode.ts'

describe('parseBattleMode', () => {
	it('defaults to one-shot when unset', () => {
		expect(parseBattleMode(undefined)).toBe('one-shot')
		expect(parseBattleMode('')).toBe('one-shot')
	})

	it('reads either mode', () => {
		expect(parseBattleMode('one-shot')).toBe('one-shot')
		expect(parseBattleMode('turn-based')).toBe('turn-based')
	})

	it('refuses an unknown mode, naming the valid ones', () => {
		expect(() => parseBattleMode('turnbased')).toThrow('BATTLE_MODE must be "one-shot" or "turn-based", got "turnbased"')
	})
})
