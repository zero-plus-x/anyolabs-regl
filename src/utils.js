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

export function hexRgbaToNormalized(hex) {
  // Support both #RRGGBB and #RRGGBBAA formats
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex)
  if (!result) return null
  
  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255
  const a = result[4] ? parseInt(result[4], 16) / 255 : 1.0
  
  return [r, g, b, a]
}


// Calculate min/max values more efficiently
export const calculateMinMax = (positions) => {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const y = positions[i + 1]
    const z = positions[i + 2]

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    minZ = Math.min(minZ, z)

    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
    maxZ = Math.max(maxZ, z)
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  }
}

// Calculate min/max distance to object from camera based on camera and object bounds
export const calculateMinMaxDistance = (cameraPosition, target, objPosMin, objPosMax) => {
  // Calculate camera view vector (camera looking towards target)
  const viewVector = [
    target[0] - cameraPosition[0],
    target[1] - cameraPosition[1],
    target[2] - cameraPosition[2]
  ]
  
  // Normalize view vector
  const viewLength = Math.sqrt(viewVector[0] * viewVector[0] + viewVector[1] * viewVector[1] + viewVector[2] * viewVector[2])
  const viewDir = [viewVector[0] / viewLength, viewVector[1] / viewLength, viewVector[2] / viewLength]
  
  // Calculate all 8 corners of the bounding box
  const corners = [
    [objPosMin[0], objPosMin[1], objPosMin[2]],
    [objPosMax[0], objPosMin[1], objPosMin[2]],
    [objPosMin[0], objPosMax[1], objPosMin[2]],
    [objPosMax[0], objPosMax[1], objPosMin[2]],
    [objPosMin[0], objPosMin[1], objPosMax[2]],
    [objPosMax[0], objPosMin[1], objPosMax[2]],
    [objPosMin[0], objPosMax[1], objPosMax[2]],
    [objPosMax[0], objPosMax[1], objPosMax[2]]
  ]
  
  // Calculate distances from camera to each corner along view direction
  let minDist = Infinity
  let maxDist = -Infinity
  
  corners.forEach(corner => {
    // Vector from camera to corner
    const toCorner = [
      corner[0] - cameraPosition[0],
      corner[1] - cameraPosition[1],
      corner[2] - cameraPosition[2]
    ]
    
    // Project onto view direction (dot product gives distance along view axis)
    const distance = toCorner[0] * viewDir[0] + toCorner[1] * viewDir[1] + toCorner[2] * viewDir[2]
    
    minDist = Math.min(minDist, distance)
    maxDist = Math.max(maxDist, distance)
  })
  
  return { minDist, maxDist }
}