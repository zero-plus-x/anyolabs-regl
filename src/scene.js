import createREGL from 'regl'
import mat4 from 'gl-mat4'
import mat3 from 'gl-mat3'
import vec3 from 'gl-vec3'
import resl from 'resl'
import createSphere from 'primitive-sphere'
import normals from 'angle-normals'
import mc from 'mouse-change'
import sphereVert from './shaders/glass.vert'
import sphereFrag from './shaders/glass.frag'
import bgFrag from './shaders/bg.frag'
import bgVert from './shaders/bg.vert'
import * as dat from 'dat.gui';

const sphere = createSphere(1, { segments: 128 })
const background = createSphere(20, { segments: 32 })
const mouse = mc()

const regl = createREGL({ extensions: ['angle_instanced_arrays'] })
const CUBE_MAP_SIZE = 512

const CUBEMAP_SIDES = [
  { cameraPosition: [0, 0, 0], target: [1, 0, 0], up: [0, -1, 0] },
  { cameraPosition: [0, 0, 0], target: [-1, 0, 0], up: [0, -1, 0] },
  { cameraPosition: [0, 0, 0], target: [0, 1, 0], up: [0, 0, 1] },
  { cameraPosition: [0, 0, 0], target: [0, -1, 0], up: [0, 0, -1] },
  { cameraPosition: [0, 0, 0], target: [0, 0, 1], up: [0, -1, 0] },
  { cameraPosition: [0, 0, 0], target: [0, 0, -1], up: [0, -1, 0] }
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
    cameraPosition: regl.this('center')
  }
})

const cubeProps = {
  projectionMatrix: new Float32Array(16),
  viewMatrix: new Float32Array(16),
  cubeFBO: null
}

function setupCube({ center, fbo }, block) {
  mat4.perspective(
    cubeProps.projectionMatrix,
    Math.PI / 2.0,
    1.0,
    0.25,
    1000.0)

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
      return mat4.perspective(this.projectionMatrix,
        this.fov,
        viewportWidth / viewportHeight,
        0.01,
        1000.0)
    },
    viewMatrix: function (context, { cameraPosition, target }) {
      return mat4.lookAt(this.viewMatrix,
        cameraPosition,
        target,
        [0, 1, 0])
    },
    cameraPosition: regl.prop('cameraPosition')
  }
}).bind(cameraProps)

const N = 3
const TOTAL = N * N * N

function generateCubeGrid(N) {
  const offset = (N - 1) / 2;
  const grid = [];

  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      for (let z = 0; z < N; z++) {
        grid.push([x - offset, y - offset, z - offset]);
      }
    }
  }
  const scale = 5
  return grid.map(p => [p[0] * scale, p[1] * scale, p[2] * scale]);
}

let offset = generateCubeGrid(N)

console.log(offset)

const offsetBuffer = regl.buffer({
  length: TOTAL * 3 * 4,
  type: 'float',
  usage: 'dynamic'
})

const drawSphere = regl({
  vert: sphereVert,
  frag: sphereFrag,

  attributes: {
    position: sphere.positions,
    normal: normals(sphere.cells, sphere.positions),
    offset: {
      buffer: offsetBuffer,
      divisor: 1
    },
    color: {
      buffer: regl.buffer(
        Array(TOTAL).fill().map((_, i) => {
          var x = Math.floor(i / N) / (N - 1)
          var z = (i % N) / (N - 1)
          return [
            x * z * 0.3 + 0.7 * z,
            x * x * 0.5 + z * z * 0.4,
            x * z * x + 0.35
          ]
        })),
      divisor: 1
    },
    angle: {
      buffer: regl.buffer(
        Array(TOTAL).fill().map((_, i) => {
          var x = Math.floor(i / N) / (N - 1)
          var z = (i % N) / (N - 1)
          return [x, z]
        })),
      divisor: 1
    }
  },
  elements: sphere.cells,
  instances: TOTAL,
  uniforms: {
    modelMatrix: (context, { position }) => mat4.translate([], mat4.identity([]), position),
    viewMatrix: regl.context('viewMatrix'),
    projectionMatrix: regl.context('projectionMatrix'),
    normalMatrix: (context, { position }) => {
      const modelMatrix = mat4.create();
      const viewMatrix = mat4.create();
      const modelViewMatrix = mat4.create();
      const normalMatrix = mat3.create();

      mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
      mat3.normalFromMat4(normalMatrix, modelViewMatrix);
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
  }
})

const sphereFbo = regl.framebufferCube(CUBE_MAP_SIZE)

resl({
  manifest: {
    palette: {
      type: 'image',
      // Nice dark one
      // src: 'assets/pal6.png'
      src: 'assets/pal_light1.png'
    },
  },

  onDone: ({ palette }) => {
    const paletteTexture = regl.texture(palette)
    const drawBackground = regl({
      cull: {
        enable: true,
        face: 'front', // Or 'front' if needed
      },
      depth: {
        enable: true,
        mask: true,
        func: 'less'
      },

      vert: bgVert,
      frag: bgFrag,

      attributes: {
        p: background.positions,
        normal: background.normals,
        uvs: background.uvs,
      },
      elements: background.cells,

      uniforms: {
        palette: paletteTexture,
        projection: regl.context('projectionMatrix'),
        view: regl.context('viewMatrix'),
        iTime: ({ tick }) => tick,
        model: (context, props) => mat4.translate([], mat4.identity([]), props.position),
        res: ({ viewportWidth, viewportHeight }) => [viewportWidth, viewportHeight],
        animSpeed: regl.prop('animSpeed'),
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
    const settings =     {
      "sphere": {
        "reflectionRoughness": 0.07,
        "refractionRoughness": 0.07,
        "refractiveIndex": 2.02,
        "noiseFrequency": 0.46530000000000005,
        "noiseScale": 0.03,
        "animSpeed": 0.05
      },
      "bg": {
        "animSpeed": 0.1
      }
    }

    const buttons = {}
    buttons['Copy settings'] = () => {
      navigator.clipboard.writeText(JSON.stringify(settings, null, 2))
    }

    const gui = new dat.GUI()

    // gui.add(settings.sphere, 'refractionRoughness').min(0.01).max(1).step(0.01);
    // gui.add(settings.sphere, 'refractiveIndex').min(1).max(2.33).step(0.01);
    // gui.add(settings.sphere, 'reflectionRoughness').min(0.01).max(1).step(0.01);
    gui.add(settings.sphere, 'noiseFrequency').min(0.0025).max(1).step(0.0001);
    gui.add(settings.sphere, 'noiseScale').min(0.1).max(2).step(0.1);
    gui.add(settings.sphere, 'animSpeed').min(0.025).max(1).step(0.05).name('Spheres speed');
    gui.add(settings.bg, 'animSpeed').min(0.025).max(1).step(0.05).name('Bg speed');

    gui.add(buttons, 'Copy settings')

    regl.frame(({ drawingBufferWidth, drawingBufferHeight, pixelRatio }) => {

      // render sphere cube map
      setupCube({ fbo: sphereFbo, center: [0,0,0] }, () => {
        regl.clear({ color: [0.2, 0.2, 0.2, 1], depth: 1 })
        drawBackground({ position: [0, 0, 0], ...settings.bg })
      })

      setupCamera({
        cameraPosition: [
          3.5,
          -8.5,
          -10
        ],
        target: [0, 0, 0]
      }, ({ tick }) => {
        regl.clear({
          color: [1, 1, 1, 1],
          depth: 1
        })
        drawBackground({
          position: [0, 0, 0],
          ...settings.bg
        })

        offsetBuffer.subdata(offset);

        drawSphere([
          {
            position: [0, 0, 0],
            envMap: sphereFbo,
            ...settings.sphere
          }
        ])
      })
    })
  },

  onProgress: (fraction) => {
    const intensity = 1.0 - fraction
    regl.clear({
      color: [intensity, intensity, intensity, 1]
    })
  }
})
