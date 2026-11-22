export type BattleMode = 'one-shot' | 'turn-based'

const isBattleMode = (value: string): value is BattleMode => value === 'one-shot' || value === 'turn-based'

/** The `BATTLE_MODE` env var: how every battle is played, one-shot unless set */
export const parseBattleMode = (raw: string | undefined): BattleMode => {
	if (!raw) return 'one-shot'
	if (!isBattleMode(raw)) throw new Error(`BATTLE_MODE must be "one-shot" or "turn-based", got "${raw}"`)
	return raw
}
