import { createSeededRandom, generateXYGridWithRandomZ, generateHueVariants } from '../utils'

export const RAND = createSeededRandom(26)

export const N = 3
export const TOTAL = N * N

export const SCALE = 2.5
export const OFFSET = generateXYGridWithRandomZ(N, RAND).map((p) => [p[0] * SCALE, p[1] * SCALE, p[2] * 7])

const base = { h: 200, s: 0.5, v: 0.01 }
export const COLORS = generateHueVariants(base, TOTAL)