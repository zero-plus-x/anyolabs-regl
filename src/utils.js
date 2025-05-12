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

export function resizeRegl(canvas, regl, updateFBO) {
  const resizeObserver = new ResizeObserver(() => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height

      // Notify regl about the new size (optional for internal buffers)
      regl._gl.viewport(0, 0, width, height)
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
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : null
}