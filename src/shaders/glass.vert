precision mediump float;

#include "lygia/generative/snoise.glsl"

attribute vec3 position;
attribute vec3 normal;
attribute vec3 offset;
attribute vec3 color;
attribute float angle;
attribute float index;

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
    vec3 offsetPos = position + offset;
    vec3 seed = offsetPos * noiseFrequency;
    seed.z += iTime * 0.001 + index;

    vec3 pos = offsetPos + normal * snoise(seed) * noiseScale;

    mat3 nMat = mat3(viewMatrix * modelMatrix);
    vWorldNormal = normalize(nMat * normal);

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = normalize(cameraPosition - vWorldPos);

    gl_Position = projectionMatrix * viewMatrix * worldPos;

    vNormal = normal;
    vColor = color;
}