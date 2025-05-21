precision highp float;
precision mediump sampler2D;
precision mediump int;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 posObj1;
uniform vec3 obj1PosMin;
uniform vec3 obj1PosMax;

attribute vec3 posObj2;
uniform vec3 obj2PosMin;
uniform vec3 obj2PosMax;

uniform float obj1Scale;
uniform float obj2Scale;

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
  ObjectSettings obj1;
  ObjectSettings obj2;
};

uniform Objects objects;

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

vec3 getGelColor(float factor) {
  return mix(objects.obj1.color.value[0], objects.obj1.color.value[1], mapBezier(factor, objects.obj1.color.bezier[0], objects.obj1.color.bezier[1], objects.obj1.color.bezier[2], objects.obj1.color.bezier[3]));
}
float getGelAlpha(float factor) {
  return mix(objects.obj1.alpha.value[0], objects.obj1.alpha.value[1], mapBezier(factor, objects.obj1.alpha.bezier[0], objects.obj1.alpha.bezier[1], objects.obj1.alpha.bezier[2], objects.obj1.alpha.bezier[3]));
}
float getGelPointSize(float factor) {
  return mix(objects.obj1.pointSize.value[0], objects.obj1.pointSize.value[1], mapBezier(factor, objects.obj1.pointSize.bezier[0], objects.obj1.pointSize.bezier[1], objects.obj1.pointSize.bezier[2], objects.obj1.pointSize.bezier[3]));
}

vec3 getPyColor(float factor) {
  return mix(objects.obj2.color.value[0], objects.obj2.color.value[1], mapBezier(factor, objects.obj2.color.bezier[0], objects.obj2.color.bezier[1], objects.obj2.color.bezier[2], objects.obj2.color.bezier[3]));
}
float getPyAlpha(float factor) {
  return mix(objects.obj2.alpha.value[0], objects.obj2.alpha.value[1], mapBezier(factor, objects.obj2.alpha.bezier[0], objects.obj2.alpha.bezier[1], objects.obj2.alpha.bezier[2], objects.obj2.alpha.bezier[3]));
}
float getPyPointSize(float factor) {
  return mix(objects.obj2.pointSize.value[0], objects.obj2.pointSize.value[1], mapBezier(factor, objects.obj2.pointSize.bezier[0], objects.obj2.pointSize.bezier[1], objects.obj2.pointSize.bezier[2], objects.obj2.pointSize.bezier[3]));
}

float getLogoTransitionValue(float percentage) {
  vec2 keyframes[5];
  keyframes[0] = vec2(0., 0.1);
  keyframes[1] = vec2(0.15, 0.2);
  keyframes[2] = vec2(0.5, 0.5);
  keyframes[3] = vec2(0.85, 0.8);
  keyframes[4] = vec2(1., 0.9);

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
  float loopTime = 0.0;//mod(uLoopTime / 20., 1.);
  float logosTransitionAmount = 0.0;//getLogoTransitionValue((loopTime < 0.5 ? loopTime : 1. - loopTime) * 2.);
  logosTransitionAmount = 0.0;//mapBezier(logosTransitionAmount, transitionBezier[0], transitionBezier[1], transitionBezier[2], transitionBezier[3]);

  mat3 obj1Scaling = mat3(1.0);
  obj1Scaling[0][0] = obj1Scale;
  obj1Scaling[1][1] = obj1Scale;
  obj1Scaling[2][2] = obj1Scale;

  mat3 obj2Scaling = mat3(1.0);
  obj2Scaling[0][0] = obj2Scale;
  obj2Scaling[1][1] = obj2Scale;
  obj2Scaling[2][2] = obj2Scale;

  vec3 _gelPosMin = obj1PosMin;
  vec3 _gelPosMax = obj1PosMax;
  vec3 _pyPosMin = obj2PosMin;
  vec3 _pyPosMax = obj2PosMax;

  vec3 logosPosMin = mix(_gelPosMin * obj1Scaling, _pyPosMin * obj2Scaling, logosTransitionAmount);
  vec3 logosPosMax = mix(_gelPosMax * obj1Scaling, _pyPosMax * obj2Scaling, logosTransitionAmount);

  float amount = 0.;

  float a = calcTransitionFactor(amount);
  float b = calcTransitionFactor(1. - amount);
  float transitionFactor = (a + b) / 2.;
  float transitionAmount = amount;

  vec3 posMin = logosPosMin;
  vec3 posMax = logosPosMax;

  vec3 logosPosition = mix(posObj1 * obj1Scaling, posObj2 * obj2Scaling, logosTransitionAmount);

  vec4 position = vec4(logosPosition, 1.);

  float inversedZDepth = (position.z - posMin.z) / (posMax.z - posMin.z);
  float zDepth = 1. - inversedZDepth;

  vec3 p1 = position.xyz;
  p1 *= .3;
  p1.y += uCurrentTime / 1.;
  vec3 p2 = position.xyz;
  p2.y += uCurrentTime * .2;
  p2 *= 1.;

  vec4 snoiseNoiseConstant = vec4(snoise3(p2) * 5.0, .0) / ((sin(uCurrentTime / 6.) + 1.) / 2. * 20. + 10.) * 0.1 * (1. - transitionFactor);
  vec4 curlNoiseConstant = vec4(curl(p2) * 5.0, .0) / ((sin(uCurrentTime / 6.) + 1.) / 2. * 20. + 10.) * 0.1 * (1. - transitionFactor);
  vec4 finalNoiseConstant = snoiseNoiseConstant + curlNoiseConstant;


  float brownian1 = fbm(position.xyz + vec3(0., uCurrentTime / 8., 0.));

  vec3 pos = position.xyz;

  vec4 finalPosition = position;
  finalPosition += finalNoiseConstant;
  finalPosition.z += amount * (brownian1 * 0.15 - 0.15);
  mat4 modelViewMatrix = modelMatrix * viewMatrix;
  position = projectionMatrix * modelViewMatrix * finalPosition;
  gl_Position = position;

  float logosPointSize = mix(getGelPointSize(zDepth) - length(snoise3(posObj1 * 2.) * 2.2), getPyPointSize(zDepth) + length(snoise3(posObj2 * 2.) / 3.), logosTransitionAmount);
  float pointSize = logosPointSize;
  gl_PointSize = pointSize * 2.;

  float alphaNoise1 = (brownian1 - 0.4) + inversedZDepth;

  float logosAlpha = mix(getGelAlpha(zDepth), getPyAlpha(zDepth), logosTransitionAmount);
  logosAlpha += alphaNoise1 - 0.5;
  float pointAlpha = logosAlpha;
  pointAlpha = pointAlpha * uAlpha;

  vec3 logosColor = mix(getGelColor(zDepth), getPyColor(zDepth), logosTransitionAmount);
  vec3 pointColor = logosColor;

  vColor = vec4(pointColor, pointAlpha);
}
