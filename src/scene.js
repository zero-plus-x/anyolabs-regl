import createREGL from 'regl'
import * as dat from 'dat.gui'
import { nextPowerOf2, resizeRegl, hexColorToRgb } from './utils'
import { createDrawSpheresCommand } from './commands/spheres'
import { createDrawDepthCommand } from './commands/spheres'
import { createDrawDepthDebugCommand } from './commands/spheres'
import { createDrawAnimatedBackgroundCommand } from './commands/background'
import { createBlurPassCommand } from './commands/blur'
import { createDOFCompositeCommand } from './commands/dofComposite'
import { TOTAL, OFFSET as offset } from './commands/constants'
import { createSetupCamera } from './commands/camera'

const canvas = document.getElementById('heroImage')
const regl = createREGL({
  canvas,
  extensions: ['angle_instanced_arrays'],
  onDone: (err, regl) => {
    if (err) {
      console.error(err)
      return
    }

    /* Setup GUI */
    // Dark settings
    // const settings = {
    //   "sphere": {
    //     "reflectionRoughness": 0.07,
    //     "refractionRoughness": 0.07,
    //     "refractiveIndex": 2.02,
    //     "noiseFrequency": 0.195,
    //     "noiseScale": 1.3,
    //     "animSpeed": 0.05
    //   },
    //   "bg": {
    //     "animSpeed": 0.1
    //   }
    // }

    // Light settings
    const settings = {
      sphere: {
        reflectionRoughness: 0.07,
        refractionRoughness: 0.07,
        refractiveIndex: 2.02,
        noiseFrequency: 0.46530000000000005,
        noiseScale: 0.1,
        animSpeed: 0.05,
      },
      bg: {
        animSpeed: 0.1,
      },
    }

    const buttons = {}
    buttons['Copy settings'] = () => {
      navigator.clipboard.writeText(JSON.stringify(settings, null, 2))
    }

    const gui = new dat.GUI()

    // gui.add(settings.sphere, 'refractionRoughness').min(0.01).max(1).step(0.01);
    // gui.add(settings.sphere, 'refractiveIndex').min(1).max(2.33).step(0.01);
    // gui.add(settings.sphere, 'reflectionRoughness').min(0.01).max(1).step(0.01);
    gui.add(settings.sphere, 'noiseFrequency').min(0.0025).max(1).step(0.0001)
    gui.add(settings.sphere, 'noiseScale').min(0.1).max(2).step(0.1)
    gui.add(settings.sphere, 'animSpeed').min(0.025).max(1).step(0.05).name('Spheres speed')
    gui.add(settings.bg, 'animSpeed').min(0.025).max(1).step(0.05).name('Bg speed')

    gui.add(buttons, 'Copy settings')

    /* Setup REGL */

    const setupCamera = createSetupCamera({
      regl,
    })

    const offsetBuffer = regl.buffer({
      length: TOTAL * 3 * 4,
      type: 'float',
      usage: 'dynamic',
    })

    const drawSpheres = createDrawSpheresCommand(regl, offsetBuffer)
    const drawDepth = createDrawDepthCommand(regl, offsetBuffer)

    const blurPass = createBlurPassCommand(regl)
    const dofComposite = createDOFCompositeCommand(regl)

    const colorPoints = [
      { position: [0, 0], color: hexColorToRgb('#9670c2') },
      { position: [1, 0], color: hexColorToRgb('#358fe8') },
      { position: [0, 1], color: hexColorToRgb('#358fe8') },
      { position: [1, 1], color: hexColorToRgb('#9670c2') },
      { position: [0.5, 0.5], color: hexColorToRgb('#c9f0fa') },
    ]

    const drawAnimatedBackground = createDrawAnimatedBackgroundCommand(regl, colorPoints)

    const width = nextPowerOf2(canvas.clientWidth)
    const height = nextPowerOf2(canvas.clientHeight)
    const bgFbo = regl.framebuffer({
      color: regl.texture({
        width,
        height,
        format: 'rgba',
        type: 'uint8',
      }),
    })
    const depthFbo = regl.framebuffer({
      color: regl.texture({
        width,
        height,
        format: 'rgba',
        type: 'uint8',
      }),
      depth: true,
    })

    const sceneFbo = regl.framebuffer({
      color: regl.texture({ width, height, format: 'rgba' }),
    })
    const blurFbo = regl.framebuffer({
      color: regl.texture({ width, height, format: 'rgba' }),
    })

    resizeRegl(canvas, regl, [bgFbo, depthFbo, sceneFbo, blurFbo])

    regl.frame(() =>
      setupCamera(
        {
          cameraPosition: [1.5, 2, 15],
          target: [0, 0, 0],
        },
        ({ time }) => {
          // Step 1: Render background + spheres into sceneFbo
          regl({ framebuffer: sceneFbo })(() => {
            regl.clear({ color: [1, 1, 1, 1], depth: 1 }) // ✅ clear FBO

            // bgFbo.resize(width, height)
            // blurFbo.resize(width, height)
            // depthFbo.resize(width, height)
            // regl.clear({ color: [1, 1, 1, 1], depth: 1 })

            // background to screen
            drawAnimatedBackground({ fbo: sceneFbo })

            // background to envMap texture
            drawAnimatedBackground({ fbo: bgFbo })

            // animate sphere Z positions
            const newOffset = offset.map(([x, y, baseZ], i) => {
              const z = baseZ + Math.sin(time * 0.01 + (i / offset.length - 0.5) * Math.PI * 13) * 10
              return [x, y, z]
            })
            offsetBuffer.subdata(newOffset)

            drawSpheres([
              {
                position: [0, 0, 0],
                envMap: bgFbo,
                fbo: sceneFbo,
                ...settings.sphere,
              },
            ])
          })

          // 1. Render scene to FBO (done earlier)
          // 2. Blur scene color texture

          regl.clear({ color: [1, 1, 1, 1], depth: 1, framebuffer: blurFbo })
          blurPass({
            colorTex: sceneFbo.color[0],
            fbo: blurFbo,
          })

          // 2. Render depth

          regl({ framebuffer: depthFbo })(() => {
            regl.clear({ color: [1, 1, 1, 1], depth: 1 }) // clear depth texture!
            drawDepth({
              position: [0, 0, 0],
              envMap: bgFbo,
              ...settings.sphere,
              fbo: depthFbo,
            })
          })

          // 3. Composite with DOF
          regl({ framebuffer: null })(() => {
            regl.clear({ color: [0, 0, 0, 1], depth: 1 })
            dofComposite({
              sharpTex: sceneFbo.color[0],
              blurTex: blurFbo.color[0],
              depthTex: depthFbo.color[0], // must be manually rendered
              focus: 0.06,
              focusRange: 0.1,
              aperture: 32.0,
              tintColor: [0, 0.7, 1],
              tintStrength: 0.05,
            })
          })
        },
      ),
    )
  },
})
