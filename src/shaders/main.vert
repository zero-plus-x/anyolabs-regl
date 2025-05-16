precision highp float;
precision mediump sampler2D;
precision mediump int;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 posGel;
uniform vec3 gelPosMin;
uniform vec3 gelPosMax;

attribute vec3 posPy;
uniform vec3 pyPosMin;
uniform vec3 pyPosMax;
attribute float colPy;

uniform float gelScale;
uniform float pyScale;

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
uniform float uLoopTime;

struct ValueWithCurve {
  vec2 value;
  vec4 bezier;
};

struct ColorWithCurve {
  vec3 value[2];
  vec4 bezier;
};

struct ObjectSettings {
  ValueWithCurve alpha;
  ValueWithCurve pointSize;
  ColorWithCurve color;
};

struct Objects {
  ObjectSettings gel;
  ObjectSettings py;
};

uniform Objects objects;

float fbmScaleScalar = 2.0;
#define FBM_SCALE_SCALAR fbmScaleScalar

#define FBM_AMPLITUD_INITIAL 1.
#define FBM_AMPLITUD_SCALAR .5

#include "./mapBezier.glsl"
#include "lygia/generative/snoise.glsl"
#include "lygia/generative/fbm.glsl"

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

vec3 getGelColor(float factor) {
  return mix(objects.gel.color.value[0], objects.gel.color.value[1], mapBezier(factor, objects.gel.color.bezier[0], objects.gel.color.bezier[1], objects.gel.color.bezier[2], objects.gel.color.bezier[3]));
}
float getGelAlpha(float factor) {
  return mix(objects.gel.alpha.value[0], objects.gel.alpha.value[1], mapBezier(factor, objects.gel.alpha.bezier[0], objects.gel.alpha.bezier[1], objects.gel.alpha.bezier[2], objects.gel.alpha.bezier[3]));
}
float getGelPointSize(float factor) {
  return mix(objects.gel.pointSize.value[0], objects.gel.pointSize.value[1], mapBezier(factor, objects.gel.pointSize.bezier[0], objects.gel.pointSize.bezier[1], objects.gel.pointSize.bezier[2], objects.gel.pointSize.bezier[3]));
}

vec3 getPyColor() {
  return objects.py.color.value[1];
}
float getPyAlpha(float factor) {
  return mix(objects.py.alpha.value[0], objects.py.alpha.value[1], mapBezier(factor, objects.py.alpha.bezier[0], objects.py.alpha.bezier[1], objects.py.alpha.bezier[2], objects.py.alpha.bezier[3]));
}
float getPyPointSize(float factor) {
  return mix(objects.py.pointSize.value[0], objects.py.pointSize.value[1], mapBezier(factor, objects.py.pointSize.bezier[0], objects.py.pointSize.bezier[1], objects.py.pointSize.bezier[2], objects.py.pointSize.bezier[3]));
}

float getLogoTransitionValue(float percentage) {
  vec2 keyframes[5];
  keyframes[0] = vec2(0., 0.);
  keyframes[1] = vec2(0.05, 0.05);
  keyframes[2] = vec2(0.5, 0.5);
  keyframes[3] = vec2(0.95, 0.95);
  keyframes[4] = vec2(1., 1.);

  // Handle edge cases
  if(percentage <= keyframes[0].x) {
    return keyframes[0].y;
  }
  if(percentage >= keyframes[4].x) {
    return keyframes[4].y;
  }

  // Iterate over keyframes to find the bracketing pair
  for(int i = 0; i < 4; i++) {
    vec2 keyframe1 = keyframes[i];
    vec2 keyframe2 = keyframes[i + 1];

    if(percentage >= keyframe1.x && percentage <= keyframe2.x) {
      // If exactly on a keyframe, return that value
      if(percentage == keyframe1.x)
        return keyframe1.y;
      if(percentage == keyframe2.x)
        return keyframe2.y;

      // Interpolate between the two values
      float t = (percentage - keyframe1.x) / (keyframe2.x - keyframe1.x);
      return mix(keyframe1.y, keyframe2.y, t);
    }
  }

  // Return a default value in case no match is found (should not happen)
  return 0.0;
}

void main() {
  float loopTime = mod(uLoopTime / 20., 1.);
  float logosTransitionAmount = getLogoTransitionValue((loopTime < 0.5 ? loopTime : 1. - loopTime) * 2.);
  logosTransitionAmount = mapBezier(logosTransitionAmount, transitionBezier[0], transitionBezier[1], transitionBezier[2], transitionBezier[3]);

  mat3 gelScaling = mat3(1.0);
  gelScaling[0][0] = gelScale;
  gelScaling[1][1] = gelScale;
  gelScaling[2][2] = gelScale;

  mat3 pyScaling = mat3(1.0);
  pyScaling[0][0] = pyScale;
  pyScaling[1][1] = pyScale;
  pyScaling[2][2] = pyScale;

  vec3 _gelPosMin = gelPosMin;
  vec3 _gelPosMax = gelPosMax;
  vec3 _pyPosMin = pyPosMin;
  vec3 _pyPosMax = pyPosMax;

  vec3 logosPosMin = mix(_gelPosMin * gelScaling, _pyPosMin * pyScaling, logosTransitionAmount);
  vec3 logosPosMax = mix(_gelPosMax * gelScaling, _pyPosMax * pyScaling, logosTransitionAmount);

  float amount = 0.;

  float a = calcTransitionFactor(amount);
  float b = calcTransitionFactor(1. - amount);
  float transitionFactor = (a + b) / 2.;
  float transitionAmount = amount;

  vec3 posMin = logosPosMin;
  vec3 posMax = logosPosMax;



  vec3 logosPosition = mix(posGel * gelScaling, posPy * pyScaling, logosTransitionAmount);

  vec4 position = vec4(logosPosition, 1.);

  float inversedZDepth = (position.z - posMin.z) / (posMax.z - posMin.z);
  float zDepth = 1. - inversedZDepth;

  vec3 p1 = position.xyz;
  p1 *= .3;
  p1.y += uCurrentTime / 10.;
  vec3 p2 = position.xyz;
  p2.y += uCurrentTime * .2;
  p2 *= 1.;

  vec4 curlNoiseConstant = vec4(snoise3(p2) * 5.0, .0) / ((sin(uCurrentTime / 6.) + 1.) / 2. * 20. + 10.) * 0.15 * (1. - transitionFactor);

  float brownian1 = fbm(position.xyz + vec3(0., uCurrentTime / 8., 0.));

  vec3 pos = position.xyz;

  vec4 finalPosition = position;
  finalPosition += curlNoiseConstant;
  finalPosition.z += amount * (brownian1 * 0.15 - 0.15);
  mat4 modelViewMatrix = modelMatrix * viewMatrix;
  position = projectionMatrix * modelViewMatrix * finalPosition;
  gl_Position = position;

  float logosPointSize = mix(getGelPointSize(zDepth) - length(snoise3(posGel * 2.) * 2.2), getPyPointSize(zDepth) + length(snoise3(posPy * 2.) / 3.), logosTransitionAmount);
  float pointSize = logosPointSize;
  gl_PointSize = pointSize;

  float alphaNoise1 = (brownian1 - 0.4) + inversedZDepth;

  float logosAlpha = mix(getGelAlpha(zDepth), getPyAlpha(zDepth), logosTransitionAmount);
  logosAlpha += alphaNoise1 - 0.5;
  float pointAlpha = logosAlpha;
  pointAlpha = pointAlpha * uAlpha;

  vec3 logosColor = mix(getGelColor(zDepth), getPyColor(), logosTransitionAmount);
  vec3 pointColor = logosColor;

  vColor = vec4(pointColor, pointAlpha);
}
