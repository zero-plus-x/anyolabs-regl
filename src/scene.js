import createREGL from 'regl'
import mat4 from 'gl-mat4'
import mat3 from 'gl-mat3'
import vec3 from 'gl-vec3'
import resl from 'resl'
import createSphere from 'primitive-sphere'
import normals from 'angle-normals'
import sphereVert from './shaders/glass.vert'
import sphereFrag from './shaders/glass.frag'
import bgFrag from './shaders/bg.frag'
import bgVert from './shaders/bg.vert'
import * as dat from 'dat.gui'
import { createSeededRandom, nextPowerOf2, resizeRegl } from './utils'

const sphere = createSphere(1, { segments: 128 })
const background = createSphere(100, { segments: 64 })

const rand = createSeededRandom(9)

const canvas = document.getElementById('heroImage')
const regl = createREGL({ canvas, extensions: ['angle_instanced_arrays'] })

resizeRegl(canvas, regl, updateFBO)

const CUBE_MAP_SIZE = 512

const CUBEMAP_SIDES = [
  { cameraPosition: [0, 0, 0], target: [1, 0, 0], up: [0, -1, 0] },
  { cameraPosition: [0, 0, 0], target: [-1, 0, 0], up: [0, -1, 0] },
  { cameraPosition: [0, 0, 0], target: [0, 1, 0], up: [0, 0, 1] },
  { cameraPosition: [0, 0, 0], target: [0, -1, 0], up: [0, 0, -1] },
  { cameraPosition: [0, 0, 0], target: [0, 0, 1], up: [0, -1, 0] },
  { cameraPosition: [0, 0, 0], target: [0, 0, -1], up: [0, -1, 0] },
]

const setupCubeFace = regl({
  framebuffer: function (context, props, batchId) {
    return this.cubeFBO.faces[batchId]
  },

  context: {
    projectionMatrix: regl.this('projectionMatrix'),
    viewMatrix: function (context, props, batchId) {
      const view = this.viewMatrix
      const side = CUBEMAP_SIDES[batchId]
      const target = vec3.add([0, 0, 0], this.center, side.target)
      mat4.lookAt(view, this.center, target, side.up)
      return view
    },
    cameraPosition: regl.this('center'),
  },
})

const cubeProps = {
  projectionMatrix: new Float32Array(16),
  viewMatrix: new Float32Array(16),
  cubeFBO: null,
}

function setupCube({ center, fbo }, block) {
  mat4.perspective(cubeProps.projectionMatrix, Math.PI / 2.0, 1.0, 0.25, 1000.0)

  cubeProps.cubeFBO = fbo
  cubeProps.center = center
  setupCubeFace.call(cubeProps, 6, block)
}

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
    viewMatrix: function (context, { cameraPosition, target }) {
      return mat4.lookAt(this.viewMatrix, cameraPosition, target, [0, 1, 0])
    },
    cameraPosition: regl.prop('cameraPosition'),
  },
}).bind(cameraProps)

const N = 6
const TOTAL = N * N

function generateXYGridWithRandomZ(N) {
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

const SCALE = 3.5
const offset = generateXYGridWithRandomZ(N).map((p) => [p[0] * SCALE, p[1] * SCALE, p[2] * 15])

const offsetBuffer = regl.buffer({
  length: TOTAL * 3 * 4,
  type: 'float',
  usage: 'dynamic',
})

function hsvToRgb({ h, s, v }) {
  let c = v * s
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  let m = v - c
  let [r, g, b] = [0, 0, 0]

  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else[r, g, b] = [c, 0, x]

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}
function generateHueVariants(baseHSV, count, hueOffset = 30, seededRand = Math.random) {
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
const base = { h: 200, s: 0.5, v: 0.01 }
const variants = generateHueVariants(base, TOTAL)
console.log(variants)
const drawSphere = regl({
  vert: sphereVert,
  frag: sphereFrag,

  attributes: {
    position: sphere.positions,
    normal: normals(sphere.cells, sphere.positions),
    offset: {
      buffer: offsetBuffer,
      divisor: 1,
    },
    color: {
      buffer: regl.buffer(variants.map((v) => hsvToRgb(v))),
      divisor: 1,
    },
    index: {
      buffer: regl.buffer(
        Array(TOTAL)
          .fill()
          .map((_, i) => i),
      ),
      divisor: 1,
    },
    angle: {
      buffer: regl.buffer(
        Array(TOTAL)
          .fill()
          .map((_, i) => {
            var x = Math.floor(i / N) / (N - 1)
            var z = (i % N) / (N - 1)
            return [x, z]
          }),
      ),
      divisor: 1,
    },
  },
  elements: sphere.cells,
  instances: TOTAL,
  uniforms: {
    modelMatrix: (context, { position }) => mat4.translate([], mat4.identity([]), position),
    viewMatrix: regl.context('viewMatrix'),
    projectionMatrix: regl.context('projectionMatrix'),
    normalMatrix: (context, { position }) => {
      const modelMatrix = mat4.create()
      const viewMatrix = mat4.create()
      const modelViewMatrix = mat4.create()
      const normalMatrix = mat3.create()

      mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix)
      mat3.normalFromMat4(normalMatrix, modelViewMatrix)
      return normalMatrix
    },
    cameraPosition: regl.context('cameraPosition'),
    envMap: regl.prop('envMap'),
    reflectionRoughness: regl.prop('reflectionRoughness'),
    refractionRoughness: regl.prop('refractionRoughness'),
    refractiveIndex: regl.prop('refractiveIndex'),
    noiseScale: regl.prop('noiseScale'),
    noiseFrequency: regl.prop('noiseFrequency'),
    iTime: ({ tick }) => tick,
    animSpeed: regl.prop('animSpeed'),
  },
})

const sphereFbo = regl.framebufferCube(CUBE_MAP_SIZE)

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

function updateFBO(width, height) {
  bgFbo.resize(width, height)
}

resl({
  manifest: {
    palette: {
      type: 'image',
      src: 'assets/palette5.png',
    },
    bgr: {
      type: 'image',
      src: 'assets/background1.jpg',
    },
  },

  onDone: ({ palette, bgr }) => {
    const paletteTexture = regl.texture(palette)
    const bgrTexture = regl.texture(bgr)

    function createPlane(position = [0, 0, 0], scale = [1, 1, 1]) {
      const positions = [
        [-1, -1, 0],
        [1, -1, 0],
        [1, 1, 0],
        [-1, 1, 0],
      ]
        .map((p) => vec3.add([], p, position))
        .map((p) => vec3.scale([], p, scale))
      const cells = [
        [0, 1, 2],
        [2, 3, 0],
      ]
      const uvs = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]
      return { positions, cells, uvs }
    }
    const background = createPlane([0, 0, -29], [100, 100, 1])
    const bgrFbo = regl.framebuffer({
      color: regl.texture({ width, height }),
      depth: true,
    })

    const backgroundConf = {
      attributes: {
        position: [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ],
        uv: [
          [0, 0],
          [1, 0],
          [0, 1],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
      },
      uniforms: {
        bgr: bgrTexture,
      },
      count: 6,
      vert: `
        precision mediump float;
        attribute vec2 position;
        attribute vec2 uv;
        varying vec2 v_uv;
    
        void main() {
          v_uv = uv;
          gl_Position = vec4(position, 0, 1);
        }
      `,
      frag: `
        uniform sampler2D bgr;
        precision mediump float;
        varying vec2 v_uv;
    
        void main() {
          gl_FragColor = texture2D(bgr, v_uv);
        }
      `,
      primitive: 'triangles',
      depth: {
        enable: false,
      },
    }
    const drawBackground = regl({
      ...backgroundConf,
      framebuffer: regl.prop('fbo')
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
        noiseScale: 0.05,
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

    regl.frame(({ drawingBufferWidth, drawingBufferHeight, pixelRatio }) => {
      // render sphere cube map
      setupCube({ fbo: sphereFbo, center: [0, 0, 0] }, () => {
        regl.clear({ color: [0.2, 0.2, 0.2, 1], depth: 1 })
        drawBackground({
          fbo: null,
          position: [0, 0, 0],
          ...settings.bg,
        })
      })

      setupCamera(
        {
          cameraPosition: [1.5, 2, 15],
          target: [0, 0, 0],
        },
        ({ tick, time }) => {
          // console.log(tick, time)
          regl.clear({
            color: [1, 1, 1, 1],
            depth: 1,
          })
          drawBackground({
            fbo: bgFbo,
            position: [0, 0, 0],
            ...settings.bg,
          })
          regl.clear({
            color: [1, 1, 1, 1],
            depth: 1,
          })
          drawBackground({
            fbo: null,
            position: [0, 0, 0],
            ...settings.bg
          })

          let newOffset = [...offset.map((p) => [...p])]
          for (let i = 0; i < offset.length; i++) {
            const sinForZ = Math.sin(time * 0.01 + (i / offset.length - 0.5) * Math.PI * 13) * 10
            const z = offset[i][2] + sinForZ
            newOffset[i][2] = z
          }

          offsetBuffer.subdata(newOffset)

          drawSphere([
            {
              position: [0, 0, 0],
              envMap: bgFbo,
              ...settings.sphere,
            },
          ])
        },
      )
    })
  },

  onProgress: (fraction) => {
    const intensity = 1.0 - fraction
    regl.clear({
      color: [intensity, intensity, intensity, 1],
    })
  },
})
