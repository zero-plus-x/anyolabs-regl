precision highp float;
precision mediump sampler2D;
precision mediump int;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform vec3 cameraPosition;
uniform vec3 target;
uniform float minCameraDistance;
uniform float maxCameraDistance;

attribute vec3 posObj1;
uniform vec3 obj1PosMin;
uniform vec3 obj1PosMax;

uniform float obj1Scale;

uniform float uAlpha;
uniform float uAmount;
uniform float uPointSize;

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

#include "./mapBezier.glsl"
#include "lygia/generative/snoise.glsl"

varying vec4 vColor;

float logB(float b, float x) {
  return log2(x) / log2(b);
}

vec3 fitVec3(vec3 value, vec3 dl, vec3 du, vec3 rl, vec3 ru) {
  return ((value - dl) / (du - dl)) * (ru - rl) + rl;
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

  // Calculate view direction (normalized vector from camera to target)
  vec3 viewDirection = normalize(target - cameraPosition);
  
  // Calculate vector from camera to current particle position
  vec3 toParticle = position.xyz - cameraPosition;
  
  // Project particle position onto view direction to get depth along camera axis
  float particleDepth = dot(toParticle, viewDirection);
  
  // Normalize depth based on min/max camera distances (0 = closest, 1 = furthest)
  float depthRange = maxCameraDistance - minCameraDistance;
  float normalizedDepth = depthRange > 0.0 ? (particleDepth - minCameraDistance) / depthRange : 0.5;
  
  // Clamp to ensure values stay in valid range
  float zDepth = clamp(normalizedDepth, 0.0, 1.0);
  float inversedZDepth = 1.0 - zDepth;

  vec3 p1 = position.xyz;
  p1 *= .3;
  p1.y += uCurrentTime / 1.;
  vec3 p2 = position.xyz;
  // p2.x *= .3;
  p2 *= 0.75;
  p2.y *= 2.;
  p2.y += uCurrentTime * .2;
  p2 *= 1.;

  vec3 sn = snoise3(p2);
  vec3 snoiseNoiseConstant = (sn * 5.0) / (30.);
  snoiseNoiseConstant *= snoiseNoiseConstant;
  vec3 finalNoiseConstant = snoiseNoiseConstant * 5.;

  vec3 pos = position.xyz;

  vec4 finalPosition = position;
  finalPosition.xyz += finalNoiseConstant;
  mat4 modelViewMatrix = modelMatrix * viewMatrix;
  position = projectionMatrix * modelViewMatrix * finalPosition;
  gl_Position = position;

  gl_PointSize = uPointSize;

  float alphaNoise1 = (length(finalNoiseConstant) - 0.5) + zDepth;
  float pointAlpha = (zDepth + alphaNoise1) * uAlpha;

  vec4 logosColor = getGradientValue(colors, (length(sn) + zDepth) / 2.);
  vec3 pointColor = logosColor.rgb;

  vColor = vec4(pointColor, pointAlpha );
}
