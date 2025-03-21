uniform sampler2D palette;
precision highp float;
varying vec2 uv;
uniform float iTime;
// void main () {
//   vec2 ptile = step(0.5, fract(uv));
//   gl_FragColor = vec4(abs(ptile.x - ptile.y) * vec3(1, 1, 1), 1);
// }

// #define SHOW_TILING

 // Permutation function
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

// Simplex noise function
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  // Offsets for other corners
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients:  ( x|y|z 1 ) * ( 1|2+z|2-y )
  float n_ = 1.0 / 7.0; // 1.0 / 7.0
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  // mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_); // mod(j,N)

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 g0 = vec3(a0.xy, h.x);
  vec3 g1 = vec3(a0.zw, h.y);
  vec3 g2 = vec3(a1.xy, h.z);
  vec3 g3 = vec3(a1.zw, h.w);

  // Normalization
  vec4 norm = taylorInvSqrt(vec4(dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3)));
  g0 *= norm.x;
  g1 *= norm.y;
  g2 *= norm.z;
  g3 *= norm.w;

  // Compute noise contributions from each corner
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(g0, x0), dot(g1, x1), dot(g2, x2), dot(g3, x3)));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

#define TAU 6.28318530718
#define MAX_ITER 5

void main() {

  //   vec2 ptile = step(0.5, fract(uv));
  // gl_FragColor = vec4(abs(ptile.x - ptile.y) * vec3(1, 1, 1), 1);
  // gl_FragColor = vec4(1., 0., 0., 1.);

  float time = iTime * .05 + 23.0;
    // uv should be the 0-1 uv of texture...    
#ifdef SHOW_TILING
  vec2 p = mod(uv * TAU * 2.0, TAU) - 250.0;
#else
  vec2 p = mod(uv * TAU, TAU) - 250.0;
#endif
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
  vec3 colour = vec3(pow(abs(c), 8.0));
  colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);

	#ifdef SHOW_TILING
	// Flash tile borders...
  vec2 pixel = 2.0 / (gl_FragCoord.xy / uv);
  float f = floor(mod(iTime * .5, 2.0)); 	// Flash value.
  vec2 first = step(pixel, uv * 2.) * f;		   	// Rule out first screen pixels and flash.
  vec2 nUv = step(fract(uv * 2.), pixel);				// Add one line of pixels per tile.
  colour = mix(colour, vec3(1.0, 1.0, 0.0), (nUv.x + nUv.y) * first.x * first.y); // Yellow line
	#endif

  vec2 nUv = uv;
  nUv.x = sin(nUv.x * 3.141592654 * 2.0) * 0.5 + 0.5;
  nUv.y = sin(nUv.y * 3.141592654 * 2.0) * 0.5 + 0.5;
  // nUv.y = nUv.y > 0.5 ? nUv.y - 0.5 : nUv.y;
  // nUv *= 2.0;			// Add one line of pixels per tile.
	// gl_FragColor = vec4(colour, 1.0);
  float height = snoise(vec3(nUv, time));
  float noise = hash(nUv) * abs(height - 0.5) * 2.;
  gl_FragColor = vec4(texture2D(palette, vec2(height, 0.0)).rgb + noise, 1.0);

}
