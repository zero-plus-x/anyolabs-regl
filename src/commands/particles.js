import vert from '../shaders/main.vert'
import frag from '../shaders/main.frag'

import mat4 from 'gl-mat4'

export const createDrawParticlesCommand = (regl, data) => {
  console.log(data)
    return regl({
      vert,
      frag,
      attributes: {
        position: data.gel.POS,
        posObj1: data.gel.POS,
        posObj2: data.python.POS,
      },
      uniforms: {
        modelMatrix: (_, { position }) => mat4.translate([], mat4.identity([]), position),
        viewMatrix: regl.context('viewMatrix'),
        projectionMatrix: regl.context('projectionMatrix'),
        uAlpha: regl.prop('uAlpha'),
        uAmount: regl.prop('uAmount'),

        "objects.obj1.alpha.value": [1, 0],
        "objects.obj1.alpha.bezier": [0, 0, 0.5, 0.5],

        "objects.obj2.alpha.value": [1, 0],
        "objects.obj2.alpha.bezier": [0, 0, 0.5, 0.5],

        "objects.obj1.pointSize.value": [2.5, 0.01],
        "objects.obj1.pointSize.bezier": [0, 0, 0.5, 0.5],

        "objects.obj2.pointSize.value": [2, 0.01],
        "objects.obj2.pointSize.bezier": [0, 0, 0.5, 0.5],
        
        // front_gel_color: "#005EFF",
        // back_gel_color: "#AA00FF",
        "objects.obj1.color.value[0]": [0x00,0x5E,0xFF].map(x => x / 255),
        "objects.obj1.color.value[1]": [0xAA, 0x00, 0xFF].map(x => x / 255),
        "objects.obj1.color.bezier": [0.2156, 0.964, 0.6969, 0.784],

        
        // first_py_color: "#005EFF",
        // second_py_color: "#AA00FF",
        "objects.obj2.color.value[0]": [0x00,0x5E,0xFF].map(x => x / 255),
        "objects.obj2.color.value[1]": [0xAA, 0x00, 0xFF].map(x => x / 255),
        "objects.obj2.color.bezier": [0.2156, 0.964, 0.6969, 0.784],
 
        transitionBezier: [ 0.25, 0, 0.5, 1 ],

        uCurrentTime: ({ time }) => time,
        uLoopTime: ({ time }) => time,

        obj1Scale: 1.2,
        obj2Scale: 1.2,

        obj1PosMin: data.gel.POS_MIN,
        obj1PosMax: data.gel.POS_MAX,
        obj2PosMin: data.python.POS_MIN,
        obj2PosMax: data.python.POS_MAX,
      },
      count: data.gel.COUNT,
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
  