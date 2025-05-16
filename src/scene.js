import createREGL from 'regl'
import { nextPowerOf2, resizeRegl } from './utils'
import { createDrawParticlesCommand } from './commands/particles'
import { createSetupCamera } from './commands/camera'
import resl from 'resl'
import { decodePoints } from './geom'
import { shuffleAndColor } from './geom'

const canvas = document.getElementById('heroImage')

resl({
  manifest: {
    gel: {
      type: 'binary',
      src: '/data/gel.bin',
    },
    python1: {
      type: 'binary',
      src: '/data/python1.bin',
    },
    python2: {
      type: 'binary',
      src: '/data/python2.bin',
    },
  },
  onDone: (resl) => {
    const binaries = resl

    const gel = decodePoints(binaries.gel)
    const python1 = decodePoints(binaries.python1)
    const python2 = decodePoints(binaries.python2)

    const POS1 = python1.POS
    const POS2 = python2.POS

    const POS = new Float32Array(POS1.length + POS2.length)
    POS.set(POS1)
    POS.set(POS2, POS1.length)

    const COL = shuffleAndColor(POS, POS1.length)

    const python = {
      POS,
      COL,
      POS_MIN: python1.POS_MIN,
      POS_MAX: python1.POS_MAX,
    }

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

        const drawParticles = createDrawParticlesCommand(regl, { gel, python })

        resizeRegl(canvas, regl, [])

        regl.frame(() =>
          setupCamera(
            {
              cameraPosition: [0, 1 , 3],
              target: [0, 0, 0],
            },
            () => {
                regl.clear({ color: [0, 0, 0, 1], framebuffer: null })

                drawParticles({
                  position: [0, 0, 0],
                  uAlpha: 1,
                  uAmount: 1,
                })
            },
          ),
        )
      },
    })
  },
})

import FPSMeter from 'fps-m'
new FPSMeter({ ui: true }).start()
