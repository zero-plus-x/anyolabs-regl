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
            morphAmount: (() => {
              // Create a dramatic easeInOutExpo morphing with continuous animation
              const t = (Math.sin(time * 0.4) * 0.5 + 0.5); // Base oscillation
              // Apply easeInOutExpo for very dramatic transitions
              const easeInOutExpo = t === 0 
                ? 0 
                : t === 1 
                ? 1 
                : t < 0.5 
                ? Math.pow(2, 20 * t - 10) / 2
                : (2 - Math.pow(2, -20 * t + 10)) / 2;
              return easeInOutExpo;
            })(),
            // Parallel rotation animation using quaternions to avoid gimbal lock
            rotationQuaternion: (() => {
              // Get current morph amount for speed modulation
              const t = (Math.sin(time * 0.4) * 0.5 + 0.5);
              const morphAmount = t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
              
              // Calculate speed modifier based on morph state
              const morphSpeedFactor = 1 - Math.pow(Math.sin(morphAmount * Math.PI), 2) * 0.7;
              
              // Create three independent rotation axes with varying speeds (capped at max)
              const maxSpeed = 0.8; // Maximum rotation speed limit
              const speedX = Math.min(((Math.sin(time * 0.15) * 0.5 + 0.5) * 1.5 + 0.3) * morphSpeedFactor, maxSpeed);
              const speedY = Math.min(((Math.sin(time * 0.23) * 0.5 + 0.5) * 1.2 + 0.4) * morphSpeedFactor, maxSpeed);
              const speedZ = Math.min(((Math.sin(time * 0.31) * 0.5 + 0.5) * 1.0 + 0.2) * morphSpeedFactor, maxSpeed);
              
              // Use modulo to keep angles bounded and prevent accumulation issues
              const angleX = (time * speedX) % (2 * Math.PI);
              const angleY = (time * speedY) % (2 * Math.PI);
              const angleZ = (time * speedZ) % (2 * Math.PI);
              
              // Create individual axis quaternions
              const halfX = angleX * 0.5;
              const halfY = angleY * 0.5;
              const halfZ = angleZ * 0.5;
              
              // X-axis quaternion
              const qx_w = Math.cos(halfX);
              const qx_x = Math.sin(halfX);
              const qx_y = 0;
              const qx_z = 0;
              
              // Y-axis quaternion
              const qy_w = Math.cos(halfY);
              const qy_x = 0;
              const qy_y = Math.sin(halfY);
              const qy_z = 0;
              
              // Z-axis quaternion
              const qz_w = Math.cos(halfZ);
              const qz_x = 0;
              const qz_y = 0;
              const qz_z = Math.sin(halfZ);
              
              // Multiply quaternions: qZ * qY * qX (order matters)
              // First: qY * qX
              const temp_w = qy_w * qx_w - qy_x * qx_x - qy_y * qx_y - qy_z * qx_z;
              const temp_x = qy_w * qx_x + qy_x * qx_w + qy_y * qx_z - qy_z * qx_y;
              const temp_y = qy_w * qx_y - qy_x * qx_z + qy_y * qx_w + qy_z * qx_x;
              const temp_z = qy_w * qx_z + qy_x * qx_y - qy_y * qx_x + qy_z * qx_w;
              
              // Then: qZ * (qY * qX)
              const final_w = qz_w * temp_w - qz_x * temp_x - qz_y * temp_y - qz_z * temp_z;
              const final_x = qz_w * temp_x + qz_x * temp_w + qz_y * temp_z - qz_z * temp_y;
              const final_y = qz_w * temp_y - qz_x * temp_z + qz_y * temp_w + qz_z * temp_x;
              const final_z = qz_w * temp_z + qz_x * temp_y - qz_y * temp_x + qz_z * temp_w;
              
              // Normalize quaternion to prevent drift
              const length = Math.sqrt(final_w * final_w + final_x * final_x + final_y * final_y + final_z * final_z);
              
              return [final_x / length, final_y / length, final_z / length, final_w / length];
            })(),
          })
        },
      )
    })
  },
})
