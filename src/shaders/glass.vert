precision mediump float;

#include "lygia/generative/snoise.glsl"

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
uniform float iTime;
uniform float instanceIndex;

void main() {
    vec3 seed = aPosition * 0.1;
    seed.z += iTime * 0.002 + instanceIndex * 1000.;

    vec3 pos = aPosition;
    pos += aNormal * snoise(seed) * 0.5;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;

    vWorldNormal = normalize(normalMatrix * aNormal);
    vViewDir = normalize(cameraPosition - vWorldPos);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}