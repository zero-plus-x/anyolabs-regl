precision mediump float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

#include "lygia/generative/worley.glsl"

// attribute vec3 position;
// attribute vec3 normal;
// attribute vec3 color;

// uniform mat3 normalMatrix;
// uniform mat4 projection;
// uniform mat4 view;
// uniform mat4 model;
// uniform vec3 eye;
// uniform float iTime;

// varying vec3 eyeDir;
// varying vec3 fragNormal;

// varying vec3 vNormal;   // Incoming normal from vertex shader
// varying vec3 vPosition; // Incoming position from vertex shader

void main() {
    vec3 seed = position * 0.5;
    seed.z += sin(iTime * 0.01) * 0.5 + 0.5;

    vec3 pos = position;
    pos += normal * worley(seed) * 0.5;
    vec4 worldPos = model * vec4(pos, 1);
    vec4 worldNormal = model * vec4(normal, 0);

    eyeDir = normalize(eye - worldPos.xyz);

    vPosition = vec3(model * view * vec4(pos, 1.0));
    vNormal = normalize(normalMatrix * normal); // Transform normal

    gl_Position = projection * view * worldPos;
}