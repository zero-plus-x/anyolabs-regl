export const createDOFCompositeCommand = (regl) => regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 v_uv;
  
      void main() {
        v_uv = 0.5 * (position + 1.0);
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,
  
    frag: `
      precision mediump float;
  
      uniform sampler2D u_colorSharp;
      uniform sampler2D u_colorBlur;
      uniform sampler2D u_depth;
      uniform float u_focus;
      uniform float u_aperture;
  
      varying vec2 v_uv;
  
      void main() {
        float depth = texture2D(u_depth, v_uv).r;
  
        // Circle of confusion (blurriness factor)
        float coc = clamp(abs(depth - u_focus) * u_aperture, 0.0, 1.0);
  
        vec3 sharp = texture2D(u_colorSharp, v_uv).rgb;
        vec3 blurred = texture2D(u_colorBlur, v_uv).rgb;
  
        gl_FragColor = vec4(mix(sharp, blurred, coc), 1.0);
      }
    `,
  
    attributes: {
      position: [
        [-1, -1],
        [1, -1],
        [-1,  1],
        [-1,  1],
        [1, -1],
        [1,  1]
      ]
    },
  
    uniforms: {
      u_colorSharp: regl.prop('sharpTex'),
      u_colorBlur: regl.prop('blurTex'),
      u_depth: regl.prop('depthTex'),
      u_focus: regl.prop('focus'),
      u_aperture: regl.prop('aperture')
    },
  
    count: 6
  });