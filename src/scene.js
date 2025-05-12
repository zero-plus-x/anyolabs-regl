import createREGL from 'regl'
import mat4 from 'gl-mat4'
import * as dat from 'dat.gui'
import {
  nextPowerOf2,
  resizeRegl,
  hexColorToRgb,
} from './utils'
import { createDrawSpheresCommand } from './commands/spheres'
import { TOTAL, OFFSET as offset} from './commands/constants'

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

    const drawAnimatedBackground = regl({
      vert: `
          precision mediump float;
          attribute vec2 position;
          varying vec2 v_uv;
          void main() {
            v_uv = 0.5 * (position + 1.0);
            gl_Position = vec4(position, 0, 1);
          }
        `,
      frag: /* glsl */ `
          precision mediump float;
  
          uniform vec2 u_positions[5];
          uniform vec3 u_colors[5];
          uniform float u_time;
          varying vec2 v_uv;
  
          void main() {
            vec3 color = vec3(0.0);
            float totalWeight = 0.0;
  
            for (int i = 0; i < 5; i++) {
              float d = distance(v_uv, u_positions[i] + 0.5 * vec2(sin(u_time + float(i)), cos(u_time + float(i))));
              float w = exp(-5.0 * d * d); // Gaussian-like falloff
              color += u_colors[i] * w;
              totalWeight += w;
            }
  
            color /= totalWeight;
            gl_FragColor = vec4(color, 1.0);
        }`,
      attributes: {
        position: [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ],
      },
      uniforms: {
        'u_positions[0]': () => colorPoints[0].position,
        'u_positions[1]': () => colorPoints[1].position,
        'u_positions[2]': () => colorPoints[2].position,
        'u_positions[3]': () => colorPoints[3].position,
        'u_positions[4]': () => colorPoints[4].position,

        'u_colors[0]': () => colorPoints[0].color,
        'u_colors[1]': () => colorPoints[1].color,
        'u_colors[2]': () => colorPoints[2].color,
        'u_colors[3]': () => colorPoints[3].color,
        'u_colors[4]': () => colorPoints[4].color,

        u_time: ({ time }) => time * 0.1,
      },
      count: 6,
      framebuffer: regl.prop('fbo'),
      depth: {
        enable: false,
      },
    })

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

    regl.frame(() => {
      setupCamera(
        {
          cameraPosition: [1.5, 2, 15],
          target: [0, 0, 0],
        },
        ({ time }) => {
          // console.log(tick, time)
          regl.clear({
            color: [1, 1, 1, 1],
            depth: 1,
          })
          drawAnimatedBackground({
            fbo: null,
          })
          drawAnimatedBackground({
            fbo: bgFbo,
          })

          let newOffset = [...offset.map((p) => [...p])]
          for (let i = 0; i < offset.length; i++) {
            const sinForZ = Math.sin(time * 0.01 + (i / offset.length - 0.5) * Math.PI * 13) * 10
            const z = offset[i][2] + sinForZ
            newOffset[i][2] = z
          }

          offsetBuffer.subdata(newOffset)

          drawSpheres([
            {
              position: [0, 0, 0],
              fbo: bgFbo,
              ...settings.sphere,
            },
          ])
        },
      )
    })
  },
})

const cameraProps = {
  fov: Math.PI / 4.0,
  projectionMatrix: new Float32Array(16),
  viewMatrix: new Float32Array(16),
  cameraPosition: [0, 0, 0],
}

const setupCamera = regl({
  context: {
    projectionMatrix: function ({ viewportWidth, viewportHeight }) {
      return mat4.perspective(this.projectionMatrix, this.fov, viewportWidth / viewportHeight, 0.01, 1000.0)
    },
    viewMatrix: function (_, { cameraPosition, target }) {
      return mat4.lookAt(this.viewMatrix, cameraPosition, target, [0, 1, 0])
    },
    cameraPosition: regl.prop('cameraPosition'),
  },
}).bind(cameraProps)
