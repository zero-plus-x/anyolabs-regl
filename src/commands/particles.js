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

        "objects.obj1.alpha.value": [1, 0],
        "objects.obj1.alpha.bezier": [0, 0, 0.5, 0.5],

        "objects.obj1.pointSize.value": [2, 0.01],
        "objects.obj1.pointSize.bezier": [0, 0, 0.5, 0.5],
        
        // front_gel_color: "#005EFF",
        // back_gel_color: "#400080",
        "objects.obj1.color.value[0]": [0x00,0x5E,0xFF].map(x => x / 255),
        "objects.obj1.color.value[1]": [0x40, 0x00, 0x80].map(x => x / 255),
        "objects.obj1.color.bezier": [0.2156, 0.964, 0.6969, 0.784],
 
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
  