import createREGL from 'regl'
import { nextPowerOf2, resizeRegl } from './utils'
import { createDrawParticlesCommand } from './commands/particles'
import { createSetupCamera } from './commands/camera'
import resl from 'resl'
import { decodePoints } from './geom'
import { shuffleAndColor } from './geom'

const canvas = document.getElementById('heroImage')

resl({
  manifest: {
    obj1: {
      type: 'binary',
      src: '/data/obj1.bin',
    },
    obj2: {
      type: 'binary',
      src: '/data/obj2.bin',
    },
  },
  onDone: (resl) => {
    // const binaries = resl

    const COUNT = 100000
    const obj1 = {COUNT: COUNT, POS: new Float32Array(COUNT * 3), POS_MIN: [0, 0, 0], POS_MAX: [1, 1, 1]}
    const obj2 = {COUNT: COUNT, POS: new Float32Array(COUNT * 3), POS_MIN: [0, 0, 0], POS_MAX: [1, 1, 1]}

    // Make a function out of sphere generation code AI!
    const sphere = new Float32Array(obj1.COUNT * 3)

    // Fill sphere with evenly distributed points
    for (let i = 0; i < obj1.COUNT; i++) {
      // Use Fibonacci sphere algorithm for even distribution
      const offset = 2.0 / obj1.COUNT;
      const y = (i * offset) - 1 + (offset / 2);
      const r = Math.sqrt(1 - y * y);
      const phi = i * (Math.PI * (3 - Math.sqrt(5))); // Golden angle
      
      // Convert to Cartesian coordinates
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;
      
      // Add some randomness to avoid perfect patterns
      const jitter = 0.05;
      sphere[i * 3] = x + (Math.random() - 0.5) * jitter;
      sphere[i * 3 + 1] = y + (Math.random() - 0.5) * jitter;
      sphere[i * 3 + 2] = z + (Math.random() - 0.5) * jitter;
    }

    // Import noise function from utils if not already available
    const noise3D = (x, y, z) => {
      // Simple 3D noise implementation
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      
      const u = fade(x);
      const v = fade(y);
      const w = fade(z);
      
      // Hash coordinates
      const A = (p[X] + Y) & 255;
      const B = (p[X + 1] + Y) & 255;
      const AA = (p[A] + Z) & 255;
      const AB = (p[A + 1] + Z) & 255;
      const BA = (p[B] + Z) & 255;
      const BB = (p[B + 1] + Z) & 255;
      
      // Blend results from 8 corners of cube
      return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z),
                                  grad(p[BA], x-1, y, z)),
                          lerp(u, grad(p[AB], x, y-1, z),
                                  grad(p[BB], x-1, y-1, z))),
                  lerp(v, lerp(u, grad(p[AA+1], x, y, z-1),
                                  grad(p[BA+1], x-1, y, z-1)),
                          lerp(u, grad(p[AB+1], x, y-1, z-1),
                                  grad(p[BB+1], x-1, y-1, z-1))));
    };
    
    // Helper functions for noise
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t, a, b) => a + t * (b - a);
    const grad = (hash, x, y, z) => {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    };
    
    // Permutation table
    const p = new Array(512);
    const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    for (let i = 0; i < 256; i++) {
      p[i] = p[i + 256] = permutation[i];
    }
    
    // Function to distort a sphere with noise
    const distortSphere = (basePositions, options = {}) => {
      const {
        scale = 6.0,
        noiseStrength = 0.25,
        offsetX = 0,
        offsetY = 0,
        offsetZ = 0,
        addRidges = false,
        ridgeThreshold = 0.2,
        ridgeStrength = 0.1
      } = options;
      
      const count = basePositions.length / 3;
      const distorted = new Float32Array(basePositions.length);
      
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const x = basePositions[idx];
        const y = basePositions[idx + 1];
        const z = basePositions[idx + 2];
        
        // Get noise value based on position with optional offsets
        const noiseValue = noise3D(
          x * scale + offsetX, 
          y * scale + offsetY, 
          z * scale + offsetZ
        );
        
        // Calculate normal (normalized position for a sphere)
        const length = Math.sqrt(x*x + y*y + z*z);
        const nx = x / length;
        const ny = y / length;
        const nz = z / length;
        
        // Apply basic distortion along the normal
        distorted[idx] = x + nx * noiseValue * noiseStrength;
        distorted[idx + 1] = y + ny * noiseValue * noiseStrength;
        distorted[idx + 2] = z + nz * noiseValue * noiseStrength;
        
        // Optionally add ridge features
        if (addRidges && noiseValue > ridgeThreshold) {
          distorted[idx] += nx * ridgeStrength;
          distorted[idx + 1] += ny * ridgeStrength;
          distorted[idx + 2] += nz * ridgeStrength;
        }
      }
      
      return distorted;
    };
    
    // Create first distorted sphere
    const distortedSphere = distortSphere(sphere, {
      scale: 6.0,
      noiseStrength: 0.25
    });
    
    // Create second distorted sphere with different parameters
    const distortedSphere2 = distortSphere(sphere, {
      scale: 5.5,
      noiseStrength: 0.25,
      offsetX: 5.0,
      offsetY: 2.5,
      offsetZ: 1.0,
      addRidges: true,
      ridgeThreshold: 0.2,
      ridgeStrength: 0.1
    });

    // Calculate min/max values more efficiently
    const calculateMinMax = (positions) => {
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      }
      
      return {
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ]
      };
    };
    
    // Set positions and calculate bounds
    obj1.POS = distortedSphere;
    const obj1Bounds = calculateMinMax(distortedSphere);
    obj1.POS_MIN = obj1Bounds.min;
    obj1.POS_MAX = obj1Bounds.max;

    obj2.POS = distortedSphere2;
    const obj2Bounds = calculateMinMax(distortedSphere2);
    obj2.POS_MIN = obj2Bounds.min;
    obj2.POS_MAX = obj2Bounds.max;

    const regl = createREGL({
      canvas,
      onDone: (err, regl) => {
        if (err) {
          console.error(err)
          return
        }

        const setupCamera = createSetupCamera({
          regl,
        })

        const drawParticles = createDrawParticlesCommand(regl, { obj1, obj2 })

        resizeRegl(canvas, regl, [])

        regl.frame(() =>
          setupCamera(
            {
              cameraPosition: [0, 1 , 3],
              target: [0, 0, 0],
            },
            () => {
                regl.clear({ color: [0, 0, 0, 1], framebuffer: null })

                drawParticles({
                  position: [0, 0, 0],
                  uAlpha: 1,
                  uAmount: 1,
                })
            },
          ),
        )
      },
    })
  },
})

import FPSMeter from 'fps-m'
new FPSMeter({ ui: true }).start()
