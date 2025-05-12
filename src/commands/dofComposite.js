export const createDOFCompositeCommand = (regl) =>
  regl({
    vert: /*glsl*/ `
      precision mediump float;
      attribute vec2 position;
      varying vec2 v_uv;
  
      void main() {
        v_uv = 0.5 * (position + 1.0);
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,

    frag: /*glsl*/ `
      precision mediump float;
  
      uniform sampler2D u_colorSharp;
      uniform sampler2D u_colorBlur;
      uniform sampler2D u_depth;
      uniform float u_focus;
      uniform float u_focusRange;
      uniform float u_aperture;
      uniform float u_blurStrength;
      uniform vec3 u_tintColor;
      uniform float u_tintStrength;

      varying vec2 v_uv;
  
      void main() {
        float depth = texture2D(u_depth, v_uv).r;
        bool hasGeometry = depth < 0.99;

        float nearEdge = u_focus - u_focusRange * 0.5;
        float farEdge = u_focus + u_focusRange * 0.5;
        
        float linearDepth = texture2D(u_depth, v_uv).r;
        
        float tintAmount = 0.0;
        float coc = 0.0;
        if (linearDepth < nearEdge) {
          tintAmount = (nearEdge - linearDepth) * u_aperture;
          coc = (nearEdge - linearDepth) * u_aperture;
        } else if (linearDepth > farEdge) {
          tintAmount = (linearDepth - farEdge) * u_aperture;
          coc = (linearDepth - farEdge) * u_aperture;
        }

        tintAmount = clamp(tintAmount * u_tintStrength, 0.0, 1.0);
        
        // clamp final blur
        coc = clamp(coc, 0.0, 1.0);
        vec3 sharp = texture2D(u_colorSharp, v_uv).rgb;
        vec3 blur = vec3(0.0);
        float total = 0.0;
        for (float x = -4.0; x <= 4.0; x++) {
          for (float y = -4.0; y <= 4.0; y++) {
            vec2 offset = vec2(x, y) * 0.001 * coc; // scale by coc

            vec3 blurBase = texture2D(u_colorBlur, v_uv + offset).rgb;

            if (hasGeometry) {
              blurBase = mix(blurBase, u_tintColor, tintAmount);
            }

            blur += blurBase;
            total += 1.0;
          }
        }
        blur /= total;

        vec3 color = mix(sharp, blur, coc);
        gl_FragColor = vec4(color, 1.0);
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
      u_colorSharp: regl.prop('sharpTex'),
      u_colorBlur: regl.prop('blurTex'),
      u_depth: regl.prop('depthTex'),
      u_focus: regl.prop('focus'),
      u_focusRange: regl.prop('focusRange'),
      u_aperture: regl.prop('aperture'),
      u_tintColor: regl.prop('tintColor'),
      u_tintStrength: regl.prop('tintStrength'),
    },

    count: 6,
  })
