import { default as initRegl } from 'regl'
import mat4 from 'gl-mat4'
import vec3 from 'gl-vec3'
import { default as icosphere } from 'icosphere'
import { default as sphere } from 'primitive-sphere'
import normals from 'angle-normals'
import mc from 'mouse-change'
const teapot = icosphere(5)
const background = sphere(20, { segments: 32 })
console.log(background)
const mouse = mc()

const regl = initRegl()
const CUBE_MAP_SIZE = 512

const GROUND_TILES = 20
const GROUND_HEIGHT = -5.0
const TEAPOT_TINT = [0.9, 1.0, 0.8]

const teapotFBO = regl.framebufferCube(CUBE_MAP_SIZE)

const CUBEMAP_SIDES = [
  { eye: [0, 0, 0], target: [1, 0, 0], up: [0, -1, 0] },
  { eye: [0, 0, 0], target: [-1, 0, 0], up: [0, -1, 0] },
  { eye: [0, 0, 0], target: [0, 1, 0], up: [0, 0, 1] },
  { eye: [0, 0, 0], target: [0, -1, 0], up: [0, 0, -1] },
  { eye: [0, 0, 0], target: [0, 0, 1], up: [0, -1, 0] },
  { eye: [0, 0, 0], target: [0, 0, -1], up: [0, -1, 0] }
]

const setupCubeFace = regl({
  framebuffer: function (context, props, batchId) {
    return this.cubeFBO.faces[batchId]
  },

  context: {
    projection: regl.this('projection'),
    view: function (context, props, batchId) {
      const view = this.view
      const side = CUBEMAP_SIDES[batchId]
      const target = vec3.add([0, 0, 0], this.center, side.target)
      mat4.lookAt(view, this.center, target, side.up)
      return view
    },
    eye: regl.this('center')
  }
})

const cubeProps = {
  projection: new Float32Array(16),
  view: new Float32Array(16),
  cubeFBO: null
}

function setupCube({ center, fbo }, block) {
  mat4.perspective(
    cubeProps.projection,
    Math.PI / 2.0,
    1.0,
    0.25,
    1000.0)

  cubeProps.cubeFBO = fbo
  cubeProps.center = center

  // execute `setupCubeFace` 6 times, where each time will be
  // a different batch, and the batchIds of the 6 batches will be
  // 0, 1, 2, 3, 4, 5
  setupCubeFace.call(cubeProps, 6, block)
}

const cameraProps = {
  fov: Math.PI / 4.0,
  projection: new Float32Array(16),
  view: new Float32Array(16)
}

const setupCamera = regl({
  context: {
    projection: function ({ viewportWidth, viewportHeight }) {
      return mat4.perspective(this.projection,
        this.fov,
        viewportWidth / viewportHeight,
        0.01,
        1000.0)
    },
    view: function (context, { eye, target }) {
      return mat4.lookAt(this.view,
        eye,
        target,
        [0, 1, 0])
    },
    eye: regl.prop('eye')
  }
}).bind(cameraProps)

const vertexShader = /*glsl*/ `
  precision highp float;
  attribute vec3 position, normal;
  uniform mat4 projection, view, model;
  uniform vec3 eye;
  varying vec3 eyeDir, fragNormal;

  void main () {
    vec4 worldPos = model * vec4(position, 1);
    vec4 worldNormal = model * vec4(normal, 0);

    fragNormal = normalize(worldNormal.xyz);
    eyeDir = normalize(eye - worldPos.xyz);
    gl_Position = projection * view * worldPos;
  }
`

const drawTeapot = regl({
  frag: /*glsl*/ `
  precision highp float;
  uniform vec3 tint;
  uniform samplerCube envMap;
  varying vec3 eyeDir, fragNormal;

  void main () {
    vec4 env = textureCube(envMap, reflect(-eyeDir, fragNormal));
    gl_FragColor = vec4(env.rgb * (normalize(fragNormal) + 0.8), 1);
  }`,

  vert: vertexShader,

  elements: teapot.cells,
  attributes: {
    position: teapot.positions.map((p) => [
      4 * p[0],
      4 * p[1],
      4 * p[2]
    ]),
    normal: normals(teapot.cells, teapot.positions)
  },

  uniforms: {
    view: regl.context('view'),
    projection: regl.context('projection'),
    eye: regl.context('eye'),
    tint: regl.prop('tint'),
    envMap: teapotFBO,
    model: (context, { position }) => mat4.translate([], mat4.identity([]), position),    
  }
})

const drawGround = regl({
  frag:
/*glsl*/`
precision highp float;
varying vec2 uv;
uniform float iTime;
// void main () {
//   vec2 ptile = step(0.5, fract(uv));
//   gl_FragColor = vec4(abs(ptile.x - ptile.y) * vec3(1, 1, 1), 1);
// }

// #define SHOW_TILING

#define TAU 6.28318530718
#define MAX_ITER 5

void main () 
{
	float time = iTime * .5+23.0;
    // uv should be the 0-1 uv of texture...    
#ifdef SHOW_TILING
	vec2 p = mod(uv*TAU*2.0, TAU)-250.0;
#else
    vec2 p = mod(uv*TAU, TAU)-250.0;
#endif
	vec2 i = vec2(p);
	float c = 1.0;
	float inten = .005;

	for (int n = 0; n < MAX_ITER; n++) 
	{
		float t = time * (1.0 - (3.5 / float(n+1)));
		i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
		c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
	}
	c /= float(MAX_ITER);
	c = 1.17-pow(c, 1.4);
	vec3 colour = vec3(pow(abs(c), 8.0));
  colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);
    

	#ifdef SHOW_TILING
	// Flash tile borders...
	vec2 pixel = 2.0 / (gl_FragCoord.xy / uv);
	float f = floor(mod(iTime*.5, 2.0)); 	// Flash value.
	vec2 first = step(pixel, uv * 2.) * f;		   	// Rule out first screen pixels and flash.
	vec2 nUv  = step(fract(uv * 2.), pixel);				// Add one line of pixels per tile.
	colour = mix(colour, vec3(1.0, 1.0, 0.0), (nUv.x + nUv.y) * first.x * first.y); // Yellow line
	#endif
	gl_FragColor = vec4(colour, 1.0);
}
  `,

  vert: /*glsl*/`
  precision highp float;
  uniform mat4 projection, view;
  uniform float height, tileSize;
  attribute vec3 p;
  attribute vec2 uvs;
  varying vec2 uv;
  void main () {
    uv = uvs;
    gl_Position = projection * view * vec4(p, 1);
  }
  `,

  attributes: {
    p: background.positions,
    normal: normals(background.cells, background.positions),
    uvs: background.uvs,
  },

  uniforms: {
    projection: regl.context('projection'),
    view: regl.context('view'),
    tileSize: regl.prop('tiles'),
    height: regl.prop('height'),
    iTime: ({tick}) => 0.01 * tick

  },

  count: background.positions.length
})

regl.frame(({ tick, drawingBufferWidth, drawingBufferHeight, pixelRatio }) => {
  const t = 0.01 * tick
  const teapotPos = [0, 3, 0]

  // render teapot cube map
  setupCube({
    fbo: teapotFBO,
    center: teapotPos
  }, () => {
    regl.clear({
      color: [0.2, 0.2, 0.2, 1],
      depth: 1
    })
    drawGround({
      height: GROUND_HEIGHT,
      tiles: GROUND_TILES
    })
  })

  const theta = 2.0 * Math.PI * (pixelRatio * mouse.x / drawingBufferWidth - 0.5)
  setupCamera({
    eye: [
      20.0 * Math.cos(theta),
      30.0 * (0.5 - pixelRatio * mouse.y / drawingBufferHeight),
      20.0 * Math.sin(theta)
    ],
    target: [0, 0, 0]
  }, ({ eye, tick }) => {
    regl.clear({
      color: [0, 0, 0, 1],
      depth: 1
    })
    drawGround({
      height: GROUND_HEIGHT,
      tiles: GROUND_TILES
    })
    drawTeapot({
      tint: TEAPOT_TINT,
      position: teapotPos
    })
  })
})