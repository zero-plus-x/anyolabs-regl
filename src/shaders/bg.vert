precision highp float;
uniform mat4 projection, view, model;
uniform float height, tileSize;
attribute vec3 p;
attribute vec2 uvs;
varying vec2 uv;
varying vec3 eyeDir;

void main() {
  uv = uvs;
  vec4 worldPos = model * vec4(p, 1);
  gl_Position = projection * view * worldPos;
}
