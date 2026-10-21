/** Small deterministic hash so every address gets its own seal colors. */
const hash = (s: string) => {
	let h = 2166136261
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i)
		h = Math.imul(h, 16777619)
	}
	return h >>> 0
}

export interface Seal {
	hueA: number
	hueB: number
	angle: number
	/** 5x5 mirrored grid, like a wax-seal monogram. */
	cells: boolean[]
}

export const sealFor = (address: string): Seal => {
	const h = hash(address)
	const h2 = hash(address.split("").reverse().join(""))
	const cells: boolean[] = []
	for (let row = 0; row < 5; row++) {
		for (let col = 0; col < 3; col++) {
			cells[row * 5 + col] = ((h2 >> (row * 3 + col)) & 1) === 1
		}
		cells[row * 5 + 3] = cells[row * 5 + 1] ?? false
		cells[row * 5 + 4] = cells[row * 5] ?? false
	}
	return {
		hueA: h % 360,
		hueB: (h >> 9) % 360,
		angle: (h >> 3) % 360,
		cells,
	}
}
