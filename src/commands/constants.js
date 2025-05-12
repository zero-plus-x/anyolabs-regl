import { createSeededRandom, generateXYGridWithRandomZ } from '../utils'

export const RAND = createSeededRandom(13)

export const N = 6
export const TOTAL = N * N

export const SCALE = 3.5
export const OFFSET = generateXYGridWithRandomZ(N, RAND).map((p) => [p[0] * SCALE, p[1] * SCALE, p[2] * 15])
