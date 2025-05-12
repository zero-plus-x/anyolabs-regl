import createREGL from 'regl'
import mat4 from 'gl-mat4'
import * as dat from 'dat.gui'
import {
  nextPowerOf2,
  resizeRegl,
  hexColorToRgb,
} from './utils'
import { createDrawSpheresCommand } from './commands/spheres'
import { createDrawAnimatedBackgroundCommand } from './commands/background'
import { TOTAL, OFFSET as offset} from './commands/constants'
import { frame } from './commands/frame'

const canvas = document.getElementById('heroImage')
const regl = createREGL({
  canvas,
  extensions: ['angle_instanced_arrays'],
  onDone: (err, regl) => {
    if (err) {
      console.error(err)
      return
    }
    resizeRegl(canvas, regl)

    const offsetBuffer = regl.buffer({
      length: TOTAL * 3 * 4,
      type: 'float',
      usage: 'dynamic',
    })

    const drawSpheres = createDrawSpheresCommand(regl, offsetBuffer)

    const colorPoints = [
      { position: [0, 0], color: hexColorToRgb('#9670c2') },
      { position: [1, 0], color: hexColorToRgb('#358fe8') },
      { position: [0, 1], color: hexColorToRgb('#358fe8') },
      { position: [1, 1], color: hexColorToRgb('#9670c2') },
      { position: [0.5, 0.5], color: hexColorToRgb('#ffffff') },
    ]

    const drawAnimatedBackground = createDrawAnimatedBackgroundCommand(regl, colorPoints)

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

    regl.frame(frame(regl, {
      bgFbo,
      offsetBuffer,
      offset,
      drawAnimatedBackground,
      drawSpheres,
      settings,
    }))
  },
})

