import { createSetupCamera } from './camera'
import { nextPowerOf2 } from '../utils'

export const frame = (
  regl,
  {
    canvas,
    bgFbo,
    sceneFbo,
    blurFbo,
    depthFbo,
    offsetBuffer,
    offset,
    drawAnimatedBackground,
    blurPass,
    dofComposite,
    drawSpheres,
    settings,
  },
) => {
  const setupCamera = createSetupCamera({
    regl,
  })
  return () => setupCamera(
    {
      cameraPosition: [1.5, 2, 15],
      target: [0, 0, 0],
    },
    ({ time }) => {
      const width = nextPowerOf2(canvas.clientWidth)
      const height = nextPowerOf2(canvas.clientHeight)
      // sceneFbo.resize(width, height)
      // Step 1: Render background + spheres into sceneFbo
      regl({ framebuffer: sceneFbo })(() => {

        // bgFbo.resize(width, height)
        // blurFbo.resize(width, height)
        // depthFbo.resize(width, height)
        // regl.clear({ color: [1, 1, 1, 1], depth: 1 })

        // background to screen
        drawAnimatedBackground({ fbo: sceneFbo })

        // background to envMap texture
        drawAnimatedBackground({ fbo: bgFbo })

        // animate sphere Z positions
        const newOffset = offset.map(([x, y, baseZ], i) => {
          const z = baseZ + Math.sin(time * 0.01 + (i / offset.length - 0.5) * Math.PI * 13) * 10
          return [x, y, z]
        })
        offsetBuffer.subdata(newOffset)

        drawSpheres([
          {
            position: [0, 0, 0],
            fbo: bgFbo,
            ...settings.sphere,
          },
        ])
        
      })

      // 1. Render scene to FBO (done earlier)
      // 2. Blur scene color texture
      blurPass({
        colorTex: sceneFbo.color[0],
        fbo: blurFbo,
      })

      // 3. Composite with DOF
      dofComposite({
        sharpTex: sceneFbo.color[0],
        blurTex: blurFbo.color[0],
        depthTex: depthFbo.color[0], // must be manually rendered
        focus: 0.5 + 0.2 * Math.sin(time * 0.5), // animate
        aperture: 8.0,
      })
    },
  )
}
