precision highp float;
attribute vec3 position, normal;
uniform mat4 projection, view, model;
uniform vec3 eye;
uniform float iTime;
varying vec3 eyeDir, fragNormal;

#include "lygia/generative/psrdnoise.glsl"

void main() {
    vec3 seed = position * 0.2;
    seed.z += sin(iTime * 0.001) * 0.5 + 0.5;
    vec3 seed2 = position * 0.5;
    seed2.z += sin(iTime * 0.001 * 2.0 + 100.);
    vec3 pos = position;
    pos += normal * psrdnoise(seed, vec3(1.0)) * 0.5;
    // pos += normal * psrdnoise(seed2, vec3(1.0)) * 0.1;
    vec4 worldPos = model * vec4(pos, 1);
    vec4 worldNormal = model * vec4(normal, 0);

    fragNormal = normalize(worldNormal.xyz);
    eyeDir = normalize(eye - worldPos.xyz);
    gl_Position = projection * view * worldPos;
}