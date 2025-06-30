export function createSeededRandom(seed) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646

  return function () {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

export function nextPowerOf2(n) {
  if (n < 1) return 1
  return 2 ** Math.ceil(Math.log2(n))
}

export function resizeRegl(canvas, regl, fbos) {
  const resizeObserver = new ResizeObserver(() => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height

      // Notify regl about the new size (optional for internal buffers)
      regl._gl.viewport(0, 0, width, height)

      fbos.forEach((fbo) => {
        fbo.resize(width, height)
      })
    }
  })

  resizeObserver.observe(canvas)
}

export function generateXYGridWithRandomZ(N, rand) {
  const offset = (N - 1) / 2
  const grid = []

  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      const z = (rand() - 0.5) * 2
      grid.push([x - offset, y - offset, z])
    }
  }

  return grid
}

export function hsvToRgb({ h, s, v }) {
  let c = v * s
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  let m = v - c
  let [r, g, b] = [0, 0, 0]

  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

export function generateHueVariants(baseHSV, count, hueOffset = 30, seededRand = Math.random) {
  const { h: baseH, s, v } = baseHSV
  const variants = []

  for (let i = 0; i < count; i++) {
    const offset = (seededRand() - 0.5) * 2 * hueOffset
    let h = (baseH + offset) % 360
    if (h < 0) h += 360
    variants.push({ h, s, v })
  }

  return variants
}

export function hexColorToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255] : null
}

// Import noise function from utils if not already available

// sphere_position = generateFibonacciSphere(sphere.COUNT, 1)

// Import noise function from utils if not already available
export const noise3D = (x, y, z) => {
  // Simple 3D noise implementation
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const Z = Math.floor(z) & 255

  x -= Math.floor(x)
  y -= Math.floor(y)
  z -= Math.floor(z)

  const u = fade(x)
  const v = fade(y)
  const w = fade(z)

  // Hash coordinates
  const A = (p[X] + Y) & 255
  const B = (p[X + 1] + Y) & 255
  const AA = (p[A] + Z) & 255
  const AB = (p[A + 1] + Z) & 255
  const BA = (p[B] + Z) & 255
  const BB = (p[B + 1] + Z) & 255

  // Blend results from 8 corners of cube
  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
      lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z)),
    ),
    lerp(
      v,
      lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1)),
    ),
  )
}

// Helper functions for noise
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const lerp = (t, a, b) => a + t * (b - a)
const grad = (hash, x, y, z) => {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

// Permutation table
const p = new Array(512)
const permutation = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21,
  10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149,
  56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229,
  122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209,
  76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
  226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
  223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
  108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179,
  162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50,
  45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
]
for (let i = 0; i < 256; i++) {
  p[i] = p[i + 256] = permutation[i]
}