import createREGL from 'regl'
import { resizeRegl, hexRgbaToNormalized, calculateMinMax, calculateMinMaxDistance } from './utils'
import { createDrawParticlesCommand } from './commands/particles'
import { createSetupCamera } from './commands/camera'
import { generateUniformSphere } from './sphere'

const canvas = document.getElementById('heroImage')

const COUNT = 60000
const obj1 = { COUNT: COUNT, POS: new Float32Array(COUNT * 3), POS_MIN: [0, 0, 0], POS_MAX: [1, 1, 1] }

const sphere = generateUniformSphere(obj1.COUNT, 0.)

// Set positions and calculate bounds
obj1.POS = sphere
const obj1Bounds = calculateMinMax(sphere)
obj1.POS_MIN = obj1Bounds.min
obj1.POS_MAX = obj1Bounds.max

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

    const drawParticles = createDrawParticlesCommand(regl, { obj1 })

    resizeRegl(canvas, regl, [])

    const cameraPosition = [0, 5, 4.5]
    // const cameraPosition = [0, 1.5, 3.5]

    const target = [0, 0, 0]
    const { minDist, maxDist } = calculateMinMaxDistance(cameraPosition, target, obj1.POS_MIN, obj1.POS_MAX)
    const depthRange = maxDist - minDist
    const inversedZDepth = depthRange > 0 ? 1.0 - ((minDist + maxDist) * 0.5 - minDist) / depthRange : 0.5

    regl.frame(() => {
      setupCamera(
        {
          cameraPosition,
          target,
        },
        () => {
          regl.clear({ color: [0, 0, 0, 0], framebuffer: null })

          drawParticles({
            cameraPosition,
            target,
            position: [0, 0, 0],
            uAlpha: 1,
            uAmount: 1,
            uPointSize: 1.5,
            inversedZDepth,
            minCameraDistance: minDist,
            maxCameraDistance: maxDist,
            colors: [
              {
                pos: 0.3,
                val: hexRgbaToNormalized('#52ffe6'),
              },
              {
                pos: 0.4,
                val: hexRgbaToNormalized('#00b5ff'),
              },
              {
                pos: 0.8,
                val: hexRgbaToNormalized('#0061ff'),
              },
              {
                pos: 1,
                val: hexRgbaToNormalized('#8000ff'),
              },
            ],
          })
        }
      )
    })
  },
})