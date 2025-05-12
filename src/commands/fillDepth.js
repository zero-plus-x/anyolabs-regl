export const createFillDepthCommand = (regl) =>
  regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,
    frag: `
      precision mediump float;
      uniform float fallbackDepth;
      void main() {
        gl_FragColor = vec4(vec3(fallbackDepth), 1.0);
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
    uniforms: {
      fallbackDepth: 1.0,
    },
    depth: {
      enable: true,
      func: 'always', // ✅ force-write to all pixels
    },
    count: 6,
    framebuffer: regl.prop('fbo'),
  });