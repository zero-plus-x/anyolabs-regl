precision highp float;
uniform mat4 projection, view, model;
uniform float height, tileSize;
attribute vec3 p;
attribute vec2 uvs;
attribute vec3 normal;

varying vec2 uv;
varying vec3 eyeDir;
varying vec3 vNormal;

void main() {
  uv = uvs;
  vec4 worldPos = model * vec4(p, 1);
  gl_Position = projection * view * worldPos;

  eyeDir = normalize(-worldPos.xyz);
  vNormal = normalize(model * vec4(normal, 0)).xyz;
}
