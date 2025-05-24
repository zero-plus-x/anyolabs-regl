# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Architecture Overview

This is a WebGL particle system built with **Regl** (a functional WebGL wrapper) and **Vite**. The application renders 100,000 particles in a 3D distorted sphere with noise-based animation.

### Core Components

- **Entry Point**: `src/scene.js` - Main scene setup with Fibonacci sphere generation, 3D noise implementation, and Regl initialization
- **Particle Rendering**: `src/commands/particles.js` - Regl command for particle rendering with WebGL shaders
- **Camera System**: `src/commands/camera.js` - Camera setup and controls
- **Shaders**: 
  - `src/shaders/main.vert` - Vertex shader handling particle positioning, noise animation, and point sizing
  - `src/shaders/main.frag` - Fragment shader for circular particle rendering
  - `src/shaders/mapBezier.glsl` - Bezier curve utility functions

### Key Technical Details

- **Particle Generation**: Uses Fibonacci sphere algorithm with 3D Perlin noise distortion for organic, cloud-like shapes
- **Animation**: Real-time noise-based particle movement using `snoise3` and `curl` functions from LYGIA shader library
- **Rendering**: Point sprites with circular masking and alpha blending for smooth particle appearance
- **Build System**: Vite with LYGIA shader resolver plugin for shader includes

### Dependencies

- **regl**: Functional WebGL abstraction layer
- **gl-mat4**: Matrix operations for 3D transformations  
- **lygia**: Shader library providing noise and mathematical functions (via vite-plugin-lygia-resolver)

The application renders particles with dynamic colors, sizes, and alpha values based on depth and noise functions, creating an animated volumetric particle cloud effect.