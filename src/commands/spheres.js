import normals from 'angle-normals'
import mat3 from 'gl-mat3'
import mat4 from 'gl-mat4'
import sphereVert from '../shaders/glass.vert'
import sphereFrag from '../shaders/glass.frag'
import { COLORS as variants, N, TOTAL } from './constants'
import { sphere } from './geometries'
import { hsvToRgb } from '../utils'

export const createDrawSpheresCommand = (regl, offsetBuffer) =>
  regl({
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
      envMap: regl.prop('fbo'),
      reflectionRoughness: regl.prop('reflectionRoughness'),
      refractionRoughness: regl.prop('refractionRoughness'),
      refractiveIndex: regl.prop('refractiveIndex'),
      noiseScale: regl.prop('noiseScale'),
      noiseFrequency: regl.prop('noiseFrequency'),
      iTime: ({ tick }) => tick,
      animSpeed: regl.prop('animSpeed'),
    },
  })


export const createDrawDepthCommand = (regl, offsetBuffer) =>
  regl({
    vert: sphereVert,

    frag: `
    precision mediump float;

    varying vec3 vWorldPos;
    uniform vec3 cameraPosition;

    void main() {
      float linearDepth = length(vWorldPos - cameraPosition) / 100.0; // normalize to [0,1]
      gl_FragColor = vec4(vec3(linearDepth), 1.0); // encode as grayscale
    }
  `,

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
              const x = Math.floor(i / N) / (N - 1)
              const z = (i % N) / (N - 1)
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
      cameraPosition: regl.context('cameraPosition'),
    },

    framebuffer: regl.prop('fbo'),
  })
