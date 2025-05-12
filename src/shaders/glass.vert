precision mediump float;

#include "lygia/generative/snoise.glsl"

attribute vec3 position;
attribute vec3 normal;
attribute vec3 offset;
attribute vec3 color;
attribute float angle;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vColor;

uniform float iTime;

uniform float noiseFrequency;
uniform float noiseScale;
uniform float animSpeed;

void main() {
    vec3 seed = position * noiseFrequency;
    seed.z += iTime * 0.0003 + 0.0001 * 1000.;

    vec3 pos = position + normal * snoise(seed) * noiseScale;

    vWorldNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - vWorldPos);

    vec4 newPos = vec4(
      +cos(angle) * pos.x + pos.z * sin(angle) + offset.x,
      pos.y + offset.y,
      -sin(angle) * pos.x  + pos.z * cos(angle) + offset.z,
      1.0);

    vec4 worldPos = modelMatrix * newPos;
    vWorldPos = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;

    vNormal = normal;
    vColor = color;
}