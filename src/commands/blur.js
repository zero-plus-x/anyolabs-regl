export const createBlurPassCommand = (regl) =>
  regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 v_uv;
  
      void main() {
        v_uv = 0.5 * (position + 1.0); // clip space [-1,1] → UV [0,1]
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,

    frag: `
      precision mediump float;
      uniform sampler2D u_color;
      uniform vec2 u_resolution;
      varying vec2 v_uv;
  
      void main() {
        vec2 texel = 1.0 / u_resolution;
        vec3 sum = vec3(0.0);
        for (int dx = -2; dx <= 2; dx++) {
          for (int dy = -2; dy <= 2; dy++) {
            vec2 offset = vec2(float(dx), float(dy)) * texel;
            sum += texture2D(u_color, v_uv + offset).rgb;
          }
        }
        gl_FragColor = vec4(sum / 25.0, 1.0);
      }
    `,

    attributes: {
      position: [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ],
    },
    framebuffer: regl.prop('fbo'),
    uniforms: {
      u_color: regl.prop('colorTex'),
      u_resolution: ({ drawingBufferWidth: w, drawingBufferHeight: h }) => [w, h],
    },
    count: 6,
  })
