export const createDrawAnimatedBackgroundCommand = (regl, colorPoints) =>
  regl({
    vert: /*glsl*/ `
          precision mediump float;
          attribute vec2 position;
          varying vec2 v_uv;
          void main() {
            v_uv = 0.5 * (position + 1.0);
            gl_Position = vec4(position, 0, 1);
          }
        `,
    frag: /* glsl */ `
          precision mediump float;
  
          uniform vec2 u_positions[9];
          uniform vec3 u_colors[9];
          uniform float u_time;
          varying vec2 v_uv;
  
          void main() {
            vec3 color = vec3(0.0);
            float totalWeight = 0.0;
  
            for (int i = 0; i < 8; i++) {
              vec2 offset = vec2(0);
              if (i == 0 || i == 3) {
                offset = 0.15 * vec2(sin(u_time + float(i)), cos(u_time + float(i)));
              }
              float d = distance(v_uv, u_positions[i] + offset);
              float w = exp(-7.5 * d * d); // Gaussian-like falloff
              color += u_colors[i] * w;
              totalWeight += w;
            }
  
            color /= totalWeight;
            gl_FragColor = vec4(color, 1.0);
        }`,
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
    uniforms: {
      'u_positions[0]': () => colorPoints[0].position,
      'u_positions[1]': () => colorPoints[1].position,
      'u_positions[2]': () => colorPoints[2].position,
      'u_positions[3]': () => colorPoints[3].position,
      'u_positions[4]': () => colorPoints[4].position,
      'u_positions[5]': () => colorPoints[5].position,
      'u_positions[6]': () => colorPoints[6].position,
      'u_positions[7]': () => colorPoints[7].position,
      'u_positions[8]': () => colorPoints[8].position,

      'u_colors[0]': () => colorPoints[0].color,
      'u_colors[1]': () => colorPoints[1].color,
      'u_colors[2]': () => colorPoints[2].color,
      'u_colors[3]': () => colorPoints[3].color,
      'u_colors[4]': () => colorPoints[4].color,
      'u_colors[5]': () => colorPoints[5].color,
      'u_colors[6]': () => colorPoints[6].color,
      'u_colors[7]': () => colorPoints[7].color,
      'u_colors[8]': () => colorPoints[8].color,

      u_time: ({ time }) => time * 1,
    },
    count: 6,
    framebuffer: regl.prop('fbo'),
    depth: {
      enable: false,
    },
  })
