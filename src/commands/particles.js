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
        posGel: data.gel.POS,
        posPy: data.python.POS,
        colPy: data.python.COL,
      },
      uniforms: {
        modelMatrix: (_, { position }) => mat4.translate([], mat4.identity([]), position),
        viewMatrix: regl.context('viewMatrix'),
        projectionMatrix: regl.context('projectionMatrix'),
        uAlpha: regl.prop('uAlpha'),
        uAmount: regl.prop('uAmount'),

        "objects.gel.alpha.value": [1, 0],
        "objects.gel.alpha.bezier": [0, 0, 0.5, 0.5],

        "objects.py.alpha.value": [1, 0],
        "objects.py.alpha.bezier": [0, 0, 0.5, 0.5],

        "objects.gel.pointSize.value": [5, 0.001],
        "objects.gel.pointSize.bezier": [0, 0, 0.5, 0.5],

        "objects.py.pointSize.value": [4, 0.001],
        "objects.py.pointSize.bezier": [0, 0, 0.5, 0.5],
        
        // front_gel_color: "#00c8ff",
        // back_gel_color: "#ff3bd2",
        "objects.gel.color.value[0]": [0x00,0xc8,0xff].map(x => x / 255),
        "objects.gel.color.value[1]": [0xff, 0x3b, 0xd2].map(x => x / 255),
        "objects.gel.color.bezier": [0, 0, 0.5, 0.5],

        
        // first_py_color: "#4b8bbe",
        // second_py_color: "#d0a716",
        "objects.py.color.value[0]": [0x4b, 0x8b, 0xbe].map(x => x / 255),
        "objects.py.color.value[1]": [0xd0, 0xa7, 0x16].map(x => x / 255),
        "objects.py.color.bezier": [0, 0, 0.5, 0.5],
 
        transitionBezier: [ 0.25, 0, 0.5, 1 ],

        uCurrentTime: ({ time }) => time,
        uLoopTime: ({ time }) => time,

        gelScale: 1.2,
        pyScale: 1.15,

        gelPosMin: data.gel.POS_MIN,
        gelPosMax: data.gel.POS_MAX,
        pyPosMin: data.python.POS_MIN,
        pyPosMax: data.python.POS_MAX,
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
  