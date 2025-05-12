precision highp float;
uniform sampler2D palette;
varying vec2 uv;
uniform float iTime;
uniform vec2 res;
uniform float animSpeed;

#include "lygia/generative/psrdnoise.glsl"
#include "lygia/generative/fbm.glsl"
#include "lygia/generative/gnoise.glsl"

#define TAU 6.28318530718
#define MAX_ITER 5

void main() {

  float time = iTime * 0.001 * animSpeed + 23.0;
  vec2 p = mod(uv * TAU, TAU) - 250.0;
  vec2 i = vec2(p);
  float c = 1.0;
  float inten = .005;

  for(int n = 0; n < MAX_ITER; n++) {
    float t = time * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
  }
  c /= float(MAX_ITER);
  c = 1.17 - pow(c, 1.4);
  
  vec2 nUv = uv;
  nUv.x += time;
  nUv.x = fract(nUv.x);
  float height = psrdnoise(nUv, vec2(1.0, 1.0));
  height = height + 0.1;
  height = height * height;
  gl_FragColor = vec4(texture2D(palette, vec2(height, 0.0)).rgb, 1.0);
}
