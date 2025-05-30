import vert from '../shaders/main.vert'
import frag from '../shaders/main.frag'

import mat4 from 'gl-mat4'

export const createDrawParticlesCommand = (regl, data) => {
    return regl({
      vert,
      frag,
      attributes: {
        position: data.obj1.POS,
        posObj1: data.obj1.POS,
      },
      uniforms: {
        modelMatrix: (_, { position }) => mat4.translate([], mat4.identity([]), position),
        viewMatrix: regl.context('viewMatrix'),
        projectionMatrix: regl.context('projectionMatrix'),
        uAlpha: regl.prop('uAlpha'),
        uAmount: regl.prop('uAmount'),

        cameraPosition: regl.prop('cameraPosition'),
        target: regl.prop('target'),

        "objects.obj1.alpha.value": [1, 0],
        "objects.obj1.alpha.bezier": [0, 0, 0.5, 0.5],

        "objects.obj1.pointSize.value": [2, 0.01],
        "objects.obj1.pointSize.bezier": [0, 0, 0.5, 0.5],

        "colors[0].val": (_, {colors}) => colors[0].val,
        "colors[1].val": (_, {colors}) => colors[1].val,
        "colors[2].val": (_, {colors}) => colors[2].val,
        "colors[3].val": (_, {colors}) => colors[3].val,
        "colors[0].pos": (_, {colors}) => colors[0].pos,
        "colors[1].pos": (_, {colors}) => colors[1].pos,
        "colors[2].pos": (_, {colors}) => colors[2].pos,
        "colors[3].pos": (_, {colors}) => colors[3].pos,

        transitionBezier: [ 0.0, 0, 1, 1 ],

        uCurrentTime: ({ time }) => time,
        uLoopTime: ({ time }) => time,

        obj1Scale: 1.2,

        obj1PosMin: data.obj1.POS_MIN,
        obj1PosMax: data.obj1.POS_MAX,
      },
      count: data.obj1.COUNT,
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
          alpha: 'add'
        },
        color: [0, 0, 0, 1]
      },
    })
  }
  