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
    obj1: {
      type: 'binary',
      src: '/data/obj1.bin',
    },
    obj2: {
      type: 'binary',
      src: '/data/obj2.bin',
    },
  },
  onDone: (resl) => {
    const binaries = resl

    const gel = decodePoints(binaries.obj1)
    const python = decodePoints(binaries.obj2)

    const sphere = new Float32Array(gel.COUNT * 3)

    // Fill sphere with evenly distributed points
    for (let i = 0; i < gel.COUNT; i++) {
      // Use Fibonacci sphere algorithm for even distribution
      const offset = 2.0 / gel.COUNT;
      const y = (i * offset) - 1 + (offset / 2);
      const r = Math.sqrt(1 - y * y);
      const phi = i * (Math.PI * (3 - Math.sqrt(5))); // Golden angle
      
      // Convert to Cartesian coordinates
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;
      
      // Add some randomness to avoid perfect patterns
      const jitter = 0.05;
      sphere[i * 3] = x + (Math.random() - 0.5) * jitter;
      sphere[i * 3 + 1] = y + (Math.random() - 0.5) * jitter;
      sphere[i * 3 + 2] = z + (Math.random() - 0.5) * jitter;
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
