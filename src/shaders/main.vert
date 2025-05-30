precision highp float;
precision mediump sampler2D;
precision mediump int;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 posObj1;
uniform vec3 obj1PosMin;
uniform vec3 obj1PosMax;

uniform float obj1Scale;

uniform float uAlpha;
uniform float uAmount;

uniform float pointSizeMin;
uniform float pointSizeMax;
uniform vec4 pointSizeBezier;

uniform float pointAlphaMin;
uniform float pointAlphaMax;
uniform vec4 pointAlphaBezier;

uniform vec4 transitionBezier;

uniform float uCurrentTime;

struct ValueWithCurve {
  vec2 value;
  vec4 bezier;
};

struct ObjectSettings {
  ValueWithCurve alpha;
  ValueWithCurve pointSize;
};

struct Objects {
  ObjectSettings obj1;
};

uniform Objects objects;


struct GradientStep {
  vec4 val;
  float pos;
};

uniform GradientStep colors[4];

vec4 getGradientValue(GradientStep values[4], float percentage) {
  // Handle edge cases
  if(percentage <= values[0].pos) {
    return values[0].val;
  }
  if(percentage >= values[3].pos) {
    return values[3].val;
  }

  // Iterate over values to find the bracketing pair
  for(int i = 0; i < 3; i++) {
    if(percentage >= values[i].pos && percentage <= values[i + 1].pos) {
      // If exactly on a value, return that value
      if(percentage == values[i].pos)
        return values[i].val;
      if(percentage == values[i + 1].pos)
        return values[i + 1].val;

      // Interpolate between the two values
      float t = (percentage - values[i].pos) / (values[i + 1].pos - values[i].pos);
      return mix(values[i].val, values[i + 1].val, t);
    }
  }

  // Return a default value in case no match is found (should not happen)
  return vec4(0.0);
}

float fbmScaleScalar = 2.0;
#define FBM_SCALE_SCALAR fbmScaleScalar

#define FBM_AMPLITUD_INITIAL 1.
#define FBM_AMPLITUD_SCALAR .5

#include "./mapBezier.glsl"
#include "lygia/generative/snoise.glsl"
#include "lygia/generative/fbm.glsl"
#include "lygia/generative/curl.glsl"

varying vec4 vColor;

float logB(float b, float x) {
  return log2(x) / log2(b);
}

vec3 fitVec3(vec3 value, vec3 dl, vec3 du, vec3 rl, vec3 ru) {
  return ((value - dl) / (du - dl)) * (ru - rl) + rl;
}

// All components are in the range [0…1], including hue.
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// All components are in the range [0…1], including hue.
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float calcTransitionFactor(float blendAmount) {
  float curlAmount = (1. - abs(blendAmount - 0.5) * 2.);
  curlAmount = clamp(curlAmount * 3., 0., 1.);
  return curlAmount;
}

float getGelAlpha(float factor) {
  return mix(objects.obj1.alpha.value[0], objects.obj1.alpha.value[1], mapBezier(factor, objects.obj1.alpha.bezier[0], objects.obj1.alpha.bezier[1], objects.obj1.alpha.bezier[2], objects.obj1.alpha.bezier[3]));
}
float getGelPointSize(float factor) {
  return mix(objects.obj1.pointSize.value[0], objects.obj1.pointSize.value[1], mapBezier(factor, objects.obj1.pointSize.bezier[0], objects.obj1.pointSize.bezier[1], objects.obj1.pointSize.bezier[2], objects.obj1.pointSize.bezier[3]));
}


void main() {
  float logosTransitionAmount = 0.0;
  logosTransitionAmount = 0.0;

  mat3 obj1Scaling = mat3(1.0);
  obj1Scaling[0][0] = obj1Scale;
  obj1Scaling[1][1] = obj1Scale;
  obj1Scaling[2][2] = obj1Scale;

  vec3 logosPosMin = obj1PosMin * obj1Scaling;
  vec3 logosPosMax = obj1PosMax * obj1Scaling;

  float amount = 0.;

  float transitionFactor = 0.;//(a + b) / 2.;
  float transitionAmount = 0.;

  vec3 posMin = logosPosMin;
  vec3 posMax = logosPosMax;

  vec3 logosPosition = posObj1 * obj1Scaling;

  vec4 position = vec4(logosPosition, 1.);

  float inversedZDepth = (position.z - posMin.z) / (posMax.z - posMin.z);
  float zDepth = 1. - inversedZDepth;

  vec3 p1 = position.xyz;
  p1 *= .3;
  p1.y += uCurrentTime / 1.;
  vec3 p2 = position.xyz;
  p2.y += uCurrentTime * .2;
  p2 *= 1.;

  vec4 snoiseNoiseConstant = vec4(snoise3(p2) * 5.0, .0) / ((sin(uCurrentTime / 6.) + 1.) / 2. * 20. + 10.) * 0.15;
  vec4 curlNoiseConstant = vec4(curl(p2) * 5.0, .0) / ((sin(uCurrentTime / 6.) + 1.) / 2. * 20. + 10.) * 0.5;
  vec4 finalNoiseConstant = snoiseNoiseConstant + curlNoiseConstant;


  float brownian1 = fbm(position.xyz + vec3(0., uCurrentTime / 8., 0.));

  vec3 pos = position.xyz;

  vec4 finalPosition = position;
  finalPosition += finalNoiseConstant;
  finalPosition.z += amount * (brownian1 * 2. - 1.);
  mat4 modelViewMatrix = modelMatrix * viewMatrix;
  position = projectionMatrix * modelViewMatrix * finalPosition;
  gl_Position = position;

  float logosPointSize = getGelPointSize(zDepth) - length(snoise3(posObj1 * 2.) * 2.2);
  float pointSize = logosPointSize;
  gl_PointSize = pointSize * 2.;

  float alphaNoise1 = (brownian1 - 0.4) + inversedZDepth;

  float logosAlpha = getGelAlpha(zDepth);
  logosAlpha += alphaNoise1 - 0.5;
  float pointAlpha = logosAlpha;
  pointAlpha = pointAlpha * uAlpha;

  vec4 logosColor = getGradientValue(colors, zDepth);
  vec3 pointColor = logosColor.rgb;

  vColor = vec4(pointColor, pointAlpha);
}
