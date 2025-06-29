import vert from '../shaders/main.vert'
import frag from '../shaders/main.frag'

import mat4 from 'gl-mat4'

export const createDrawParticlesCommand = (regl, data) => {
  return regl({
    vert,
    frag,
    attributes: {
      sphere_position: data.sphere.POS,
    },
    uniforms: {
      modelMatrix: (_, { position }) => mat4.translate([], mat4.identity([]), position),
      viewMatrix: regl.context('viewMatrix'),
      projectionMatrix: regl.context('projectionMatrix'),
      uAlpha: regl.prop('uAlpha'),
      uAmount: regl.prop('uAmount'),
      uTaperFactor: regl.prop('uTaperFactor'),

      'sphere.alpha.value': [1, 0],
      'sphere.alpha.bezier': [0, 0, 0.5, 0.5],

      'sphere.pointSize.value': [2, 0.01],
      'sphere.pointSize.bezier': [0, 0, 0.5, 0.5],

      'sphere.color.value[0]': regl.prop('color0'),
      'sphere.color.value[1]': regl.prop('color1'),
      'sphere.color.bezier': [0.2156, 0.964, 0.6969, 0.784],
      'sphere.posMin': data.sphere.POS_MIN,
      'sphere.posMax': data.sphere.POS_MAX,
      'sphere.scale': 0.8,

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
