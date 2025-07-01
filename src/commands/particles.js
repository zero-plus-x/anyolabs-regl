import vert from '../shaders/main.vert'
import frag from '../shaders/main.frag'

import mat4 from 'gl-mat4'

export const createDrawParticlesCommand = (regl, data) => {
  return regl({
    vert,
    frag,
    attributes: {
      sphere_position: data.sphere.POS,
      sphere_color: { buffer: data.sphere.COL, size: 4 },
      sphere_size: data.sphere.SIZE,
      cube_position: data.cube.POS,
      cube_color: { buffer: data.cube.COL, size: 4 },
      cube_size: data.cube.SIZE,
    },
    uniforms: {
      modelMatrix: (_, { position, rotationQuaternion }) => {
        const modelMatrix = mat4.create()
        
        // Start with identity
        mat4.identity(modelMatrix)
        
        // Apply rotation first (around origin)
        const [x, y, z, w] = rotationQuaternion
        const rotationMatrix = mat4.create()
        mat4.fromQuat(rotationMatrix, [x, y, z, w])
        mat4.multiply(modelMatrix, modelMatrix, rotationMatrix)
        
        // Then apply translation to final position
        mat4.translate(modelMatrix, modelMatrix, position)
        
        return modelMatrix
      },
      viewMatrix: regl.context('viewMatrix'),
      projectionMatrix: regl.context('projectionMatrix'),
      uAlpha: regl.prop('uAlpha'),
      uAmount: regl.prop('uAmount'),
      uTaperFactor: regl.prop('uTaperFactor'),
      morphAmount: regl.prop('morphAmount'),
      rotationQuaternion: regl.prop('rotationQuaternion'),

      'sphere.alpha.value': [1, 0],
      'sphere.alpha.bezier': [0, 0, 1, 1],

      'sphere.pointSize.value': [2, 0.6],
      'sphere.pointSize.bezier': [0, 0, 0.15, 0.25],

      'sphere.color.value[0]': [0.74,0.74,0.74],
      'sphere.color.value[1]': [0.74,0.74,0.74],
      'sphere.color.bezier': [0., 0., 1, 1],
      'sphere.posMin': data.sphere.POS_MIN,
      'sphere.posMax': data.sphere.POS_MAX,
      'sphere.scale': 0.64,

      'cube.alpha.value': [1, 0],
      'cube.alpha.bezier': [0, 0, 1, 1],

      'cube.pointSize.value': [2, 0.6],
      'cube.pointSize.bezier': [0, 0, 0.15, 0.25],

      'cube.color.value[0]': [0.74,0.74,0.74],
      'cube.color.value[1]': [0.74,0.74,0.74],
      'cube.color.bezier': [0., 0., 1, 1],
      'cube.posMin': data.cube.POS_MIN,
      'cube.posMax': data.cube.POS_MAX,
      'cube.scale': 0.8,

      transitionBezier: [0.0, 0, 1, 1],

      uCurrentTime: ({ time }) => time,
    },
    count: data.sphere.COUNT,
    primitive: 'points',
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 'src alpha',
        dstRGB: 'one minus src alpha',
        dstAlpha: 'one minus src alpha',
      },
      equation: {
        rgb: 'add',
        alpha: 'add',
      },
      color: [0, 0, 0, 1],
    },
  })
}
