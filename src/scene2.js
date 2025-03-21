import { default as initRegl } from 'regl'
import mat4 from 'gl-mat4'
import vec3 from 'gl-vec3'
import { default as resl } from 'resl'
import { default as icosphere } from 'icosphere'
import { default as sphere } from 'primitive-sphere'
import normals from 'angle-normals'
import mc from 'mouse-change'

import sphereVert from './shaders/sphere.vert'
import sphereFrag from './shaders/sphere.frag'
import bgFrag from './shaders/bg.frag'
import bgVert from './shaders/bg.vert'

const teapot = icosphere(5)
const background = sphere(20, { segments: 32 })
const mouse = mc()

const regl = initRegl()
const CUBE_MAP_SIZE = 512

const GROUND_TILES = 20
const GROUND_HEIGHT = -5.0
const TEAPOT_TINT = [1, 1, 1]

const teapotFBO = regl.framebufferCube(CUBE_MAP_SIZE)

const CUBEMAP_SIDES = [
  { eye: [0, 0, 0], target: [1, 0, 0], up: [0, -1, 0] },
  { eye: [0, 0, 0], target: [-1, 0, 0], up: [0, -1, 0] },
  { eye: [0, 0, 0], target: [0, 1, 0], up: [0, 0, 1] },
  { eye: [0, 0, 0], target: [0, -1, 0], up: [0, 0, -1] },
  { eye: [0, 0, 0], target: [0, 0, 1], up: [0, -1, 0] },
  { eye: [0, 0, 0], target: [0, 0, -1], up: [0, -1, 0] }
]

const setupCubeFace = regl({
  framebuffer: function (context, props, batchId) {
    return this.cubeFBO.faces[batchId]
  },

  context: {
    projection: regl.this('projection'),
    view: function (context, props, batchId) {
      const view = this.view
      const side = CUBEMAP_SIDES[batchId]
      const target = vec3.add([0, 0, 0], this.center, side.target)
      mat4.lookAt(view, this.center, target, side.up)
      return view
    },
    eye: regl.this('center')
  }
})

const cubeProps = {
  projection: new Float32Array(16),
  view: new Float32Array(16),
  cubeFBO: null
}

function setupCube({ center, fbo }, block) {
  mat4.perspective(
    cubeProps.projection,
    Math.PI / 2.0,
    1.0,
    0.25,
    1000.0)

  cubeProps.cubeFBO = fbo
  cubeProps.center = center

  // execute `setupCubeFace` 6 times, where each time will be
  // a different batch, and the batchIds of the 6 batches will be
  // 0, 1, 2, 3, 4, 5
  setupCubeFace.call(cubeProps, 6, block)
}

const cameraProps = {
  fov: Math.PI / 4.0,
  projection: new Float32Array(16),
  view: new Float32Array(16)
}

const setupCamera = regl({
  context: {
    projection: function ({ viewportWidth, viewportHeight }) {
      return mat4.perspective(this.projection,
        this.fov,
        viewportWidth / viewportHeight,
        0.01,
        1000.0)
    },
    view: function (context, { eye, target }) {
      return mat4.lookAt(this.view,
        eye,
        target,
        [0, 1, 0])
    },
    eye: regl.prop('eye')
  }
}).bind(cameraProps)

const vertexShader = /*glsl*/ `
`

const drawSphere = regl({
  frag: sphereFrag,

  vert: sphereVert,

  elements: teapot.cells,
  attributes: {
    position: teapot.positions.map((p) => [
      4 * p[0],
      4 * p[1],
      4 * p[2]
    ]),
    normal: normals(teapot.cells, teapot.positions)
  },

  uniforms: {
    view: regl.context('view'),
    projection: regl.context('projection'),
    eye: regl.context('eye'),
    tint: regl.prop('tint'),
    envMap: teapotFBO,
    model: (context, { position }) => mat4.translate([], mat4.identity([]), position),
    iTime: ({ tick }) => tick,
  }
})

resl({
  manifest: {
    palette: {
      type: 'image',
      src: 'assets/palette4.png'
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
  frag: bgFrag,

  vert: bgVert,

  // primitive: 'triangles',

  attributes: {
    p: background.positions,
    normal: background.normals,
    uvs: background.uvs,
    // indices: background.cells
  },

  uniforms: {
    palette: paletteTexture,
    projection: regl.context('projection'),
    view: regl.context('view'),
    tileSize: regl.prop('tiles'),
    height: regl.prop('height'),
    iTime: ({ tick }) => 0.01 * tick,
    model: (context, props) => mat4.translate([], mat4.identity([]), props.position),
    res: ({ viewportWidth, viewportHeight }) => [viewportWidth, viewportHeight],
  },

  elements: background.cells
})
regl.frame(({ drawingBufferWidth, drawingBufferHeight, pixelRatio }) => {
  const teapotPos = [0, 0, 0]

  // render teapot cube map
  setupCube({
    fbo: teapotFBO,
    center: teapotPos
  }, () => {
    regl.clear({
      color: [0.2, 0.2, 0.2, 1],
      depth: 1
    })
    drawBackground({
      height: GROUND_HEIGHT,
      tiles: GROUND_TILES,
      position: [0, 0, 0]
    })
  })

  const theta = 2.0 * Math.PI * (pixelRatio * mouse.x / drawingBufferWidth - 0.5)
  setupCamera({
    eye: [
      20.0 * Math.cos(theta),
      30.0 * (0.5 - pixelRatio * mouse.y / drawingBufferHeight),
      20.0 * Math.sin(theta)
    ],
    target: [0, 0, 0]
  }, ({ eye, tick }) => {
    regl.clear({
      color: [1, 1, 1, 1],
      depth: 1
    })
    drawBackground({
      height: GROUND_HEIGHT,
      tiles: GROUND_TILES,
      position: [0, 0, 0]
    })
    drawSphere({
      tint: TEAPOT_TINT,
      position: teapotPos
    })
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
