/** Returns a wrapper that runs at most `max` tasks at once, queueing the rest in call order */
export function limitConcurrency(max: number) {
	let active = 0
	const waiting: (() => void)[] = []

	return async <T>(task: () => Promise<T>): Promise<T> => {
		if (active >= max) await new Promise<void>(resolve => waiting.push(resolve))
		else active++

		try {
			return await task()
		} finally {
			// Hand the slot straight to the next waiter, so `active` never dips and lets a newcomer jump the queue
			const next = waiting.shift()
			if (next) next()
			else active--
		}
	}
}
