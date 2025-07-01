precision highp float;
precision mediump int;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform float uAlpha;
uniform float uAmount;

uniform float uTaperFactor;
uniform float morphAmount;
uniform float rotationX;
uniform float rotationY;
uniform float rotationZ;

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

struct ColorWithCurve {
  vec3 value[2];
  vec4 bezier;
};

attribute vec3 sphere_position;
attribute vec4 sphere_color;
attribute float sphere_size;
attribute vec3 cube_position;
attribute vec4 cube_color;
attribute float cube_size;

struct ObjectData {
  ValueWithCurve alpha;
  ValueWithCurve pointSize;
  ColorWithCurve color;
  vec3 posMin;
  vec3 posMax;
  float scale;
};
uniform ObjectData sphere;
uniform ObjectData cube;

float fbmScaleScalar = 2.0;
#define FBM_SCALE_SCALAR fbmScaleScalar

#define FBM_AMPLITUD_INITIAL 10.
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
  return mix(sphere.color.value[0], sphere.color.value[1],factor);
}
float getGelAlpha(float factor) {
  return mix(sphere.alpha.value[0], sphere.alpha.value[1], factor);
}
float getGelPointSize(float factor) {
  return mix(sphere.pointSize.value[0], sphere.pointSize.value[1], factor);
}

vec3 applyTaper(vec3 pos, float taperAxisMin, float taperAxisMax) {
    // Compute normalized taper factor (0 to 1) along Y axis
    float t = (pos.y - taperAxisMin) / (taperAxisMax - taperAxisMin);
    t = clamp(t, 0.0, 1.0); // ensure within range

    // Linear taper scaling factor
    // uTaperFactor
    float f = 1.0;//uTaperFactor;
    float scale = 1.0 + f * t;

    // Apply non-uniform scale to X and Z only
    pos.y *= scale;
    pos.z *= scale;

    return pos;
}

void main() {
  float logosTransitionAmount = 0.0;
  logosTransitionAmount = 0.0;

  // Sphere scaling
  mat3 sphereScaling = mat3(1.0);
  sphereScaling[0][0] = sphere.scale;
  sphereScaling[1][1] = sphere.scale;
  sphereScaling[2][2] = sphere.scale;

  // Cube scaling
  mat3 cubeScaling = mat3(1.0);
  cubeScaling[0][0] = cube.scale;
  cubeScaling[1][1] = cube.scale;
  cubeScaling[2][2] = cube.scale;

  // Calculate bounds for both objects
  vec3 spherePosMin = sphere.posMin * sphereScaling;
  vec3 spherePosMax = sphere.posMax * sphereScaling;
  vec3 cubePosMin = cube.posMin * cubeScaling;
  vec3 cubePosMax = cube.posMax * cubeScaling;

  // Morph positions between sphere and cube
  vec3 spherePosition = sphere_position * sphere.scale;
  vec3 cubePosition = cube_position * cube.scale;
  vec3 morphedPosition = mix(spherePosition, cubePosition, morphAmount);

  // Morph bounds
  vec3 posMin = mix(spherePosMin, cubePosMin, morphAmount);
  vec3 posMax = mix(spherePosMax, cubePosMax, morphAmount);

  float amount = 0.;

  float transitionFactor = 0.;
  float transitionAmount = 0.;

  vec4 position = vec4(morphedPosition, 1.);

  float inversedZDepth = (position.z - posMin.z) / (posMax.z - posMin.z);
  float zDepth = 1. - inversedZDepth;

  vec3 p1 = position.xyz;
  p1 *= .3;
  p1.y += uCurrentTime / 1.;
  vec3 p2 = position.xyz;
  p2.y += uCurrentTime * .2;
  p2 *= 1.;

  // vec4 snoiseNoiseConstant = vec4(snoise3(p2) * 5.0, .0) / ((sin(uCurrentTime / 6.) + 1.) / 2. * 20. + 10.) * 0.1 * (1. - 0.);
  // vec4 curlNoiseConstant = vec4(curl(p2) * 5.0, .0) / ((sin(uCurrentTime / 6.) + 1.) / 2. * 20. + 10.) * 0.1 * (1. - 0.);
  // vec4 finalNoiseConstant = snoiseNoiseConstant + curlNoiseConstant;


  float brownian1 = fbm(position.xyz * 10. + vec3(0., uCurrentTime / 1., 0.));

  vec3 pos = position.xyz;

  vec4 finalPosition = position;
  // finalPosition += finalNoiseConstant;
  finalPosition.z += amount * (brownian1 * 0.15 - 0.15);
  
  // Apply rotation transformations
  float cosX = cos(rotationX);
  float sinX = sin(rotationX);
  float cosY = cos(rotationY);
  float sinY = sin(rotationY);
  float cosZ = cos(rotationZ);
  float sinZ = sin(rotationZ);
  
  // Rotation around X axis
  vec3 rotatedPos = finalPosition.xyz;
  float tempY = rotatedPos.y * cosX - rotatedPos.z * sinX;
  float tempZ = rotatedPos.y * sinX + rotatedPos.z * cosX;
  rotatedPos.y = tempY;
  rotatedPos.z = tempZ;
  
  // Rotation around Y axis
  float tempX = rotatedPos.x * cosY + rotatedPos.z * sinY;
  tempZ = -rotatedPos.x * sinY + rotatedPos.z * cosY;
  rotatedPos.x = tempX;
  rotatedPos.z = tempZ;
  
  // Rotation around Z axis
  tempX = rotatedPos.x * cosZ - rotatedPos.y * sinZ;
  tempY = rotatedPos.x * sinZ + rotatedPos.y * cosZ;
  rotatedPos.x = tempX;
  rotatedPos.y = tempY;
  
  finalPosition.xyz = rotatedPos;
  
  mat4 modelViewMatrix = modelMatrix * viewMatrix;
  position = projectionMatrix * modelViewMatrix * finalPosition;
  
  gl_Position = position;

  // Morph point size based on both objects
  float spherePointSize = sphere_size * 4. + 1.2;
  float cubePointSize = cube_size * 4. + 1.2;
  float morphedPointSize = mix(spherePointSize, cubePointSize, morphAmount);
  float pointSize = clamp(morphedPointSize, 1., 6.);
  gl_PointSize = pointSize;
  
  // Morph colors between sphere and cube
  vec4 sphereColor = sphere_color;
  sphereColor.a *= sphereColor.a * sphereColor.a;
  sphereColor.a = clamp(sphereColor.a, 0., 1.);
  sphereColor.a = 1. - sphereColor.a;
  vec4 cubeColor = cube_color;
  cubeColor.a += 0.2;
  cubeColor.a = clamp(cubeColor.a, 0.2, 1.);
  vec4 morphedColor = mix(sphereColor, cubeColor, morphAmount);
  morphedColor.a = clamp(morphedColor.a / 2. + brownian1 / 2., 0., 1.);

  vColor = morphedColor;
}
