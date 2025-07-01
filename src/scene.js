import createREGL from 'regl'
import { resizeRegl, noise3D } from './utils'
import { createDrawParticlesCommand } from './commands/particles'
import { createSetupCamera } from './commands/camera'
import { generateVolumeSphere, generateCubeSurface, proximityGenerator, shuffleComponents, shuffleMultipleArrays, generateColorsByDistToCenter, generateSizeByPosition } from './generators'

const canvas = document.getElementById('heroImage')

// Mouse and orientation tracking for camera control
let targetCameraX = 0
let currentCameraX = 0
let lastTime = 0
let targetTaperFactor = 1.
let currentTaperFactor = 1.

const updateMousePosition = (event) => {
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const width = rect.width
  // Map from [0, width] to [1, -1] (leftmost = 1, rightmost = -1)
  const f = x / width;
  targetCameraX = (f * 2 - 1) * 2.25
  targetTaperFactor = (Math.abs(f - 0.5)) * 5.;
}

canvas.addEventListener('mousemove', updateMousePosition)

const COUNT = 2200
const sphere = { COUNT: COUNT, SIZE: new Float32Array(COUNT).fill(2.), POS: new Float32Array(COUNT * 3), COL: new Float32Array(COUNT * 4), POS_MIN: [0, 0, 0], POS_MAX: [1, 1, 1] }
const cube = { COUNT: COUNT, SIZE: new Float32Array(COUNT).fill(2.), POS: new Float32Array(COUNT * 3), COL: new Float32Array(COUNT * 4), POS_MIN: [0, 0, 0], POS_MAX: [1, 1, 1] }

// Calculate min/max values more efficiently
const calculateMinMax = (positions) => {
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
// Set positions and calculate bounds for cube
const cubeData = generateCubeSurface(cube.COUNT, 0.18, true)
cube.POS = cubeData.positions
cube.COL = cubeData.colors
cube.SIZE = generateSizeByPosition(cube.POS, 5)

const cubeBounds = calculateMinMax(cube.POS)
cube.POS_MIN = cubeBounds.min
cube.POS_MAX = cubeBounds.max

// Set positions and calculate bounds for sphere
const sphereData = generateVolumeSphere(cube.COUNT, 0.05)
sphere.POS = proximityGenerator(cube.POS, sphereData.positions, false, 10)
sphere.COL = generateColorsByDistToCenter(sphere.POS)
sphere.SIZE = generateSizeByPosition(sphere.POS, 5)

const sphereBounds = calculateMinMax(sphere.POS)
sphere.POS_MIN = sphereBounds.min
sphere.POS_MAX = sphereBounds.max

console.log(sphereBounds)


console.log(sphere, cube)

const regl = createREGL({
  canvas,
  onDone: (err, regl) => {
    if (err) {
      console.error(err)
      return
    }

    const setupCamera = createSetupCamera({
      regl,
    })
    const drawParticles = createDrawParticlesCommand(regl, { sphere, cube })

    resizeRegl(canvas, regl, [])

    regl.frame(({ time }) => {
      // Calculate delta time
      const deltaTime = lastTime === 0 ? 0.016 : time - lastTime
      lastTime = time
      
      // Smooth interpolation - lerp towards target with fixed speed
      const lerpSpeed = 1 - Math.pow(0.001, deltaTime) // Exponential decay over 500ms
      currentCameraX += (targetCameraX - currentCameraX) * lerpSpeed
      currentTaperFactor += (targetTaperFactor - currentTaperFactor) * lerpSpeed
      setupCamera(
        {
          cameraPosition: [currentCameraX, 1, 3],
          target: [0, 0, 0],
        },
        () => {
          regl.clear({ color: [0, 0, 0, 0], framebuffer: null })

          drawParticles({
            position: [0, 0, 0],
            uAlpha: 1,
            uAmount: 1,
            color0: [0, 94, 255].map(x => x / 255),
            color1: [141, 0, 203].map(x => x / 255),
            uTaperFactor: currentTaperFactor,
            morphAmount: Math.sin(time * 0.5) * 0.5 + 0.5, // Animate morph between 0 and 1
          })
        },
      )
    })
  },
})
