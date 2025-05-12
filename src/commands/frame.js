import { createSetupCamera } from './camera'

export const frame = (regl, { bgFbo, offsetBuffer, offset, drawAnimatedBackground, drawSpheres, settings }) => {
    const setupCamera = createSetupCamera({
      regl
    })
    return () => setupCamera(
      {
        cameraPosition: [1.5, 2, 15],
        target: [0, 0, 0],
      },
      ({ time }) => {
        // console.log(tick, time)
        regl.clear({
          color: [1, 1, 1, 1],
          depth: 1,
        })
        drawAnimatedBackground({
          fbo: null,
        })
        drawAnimatedBackground({
          fbo: bgFbo,
        })

        let newOffset = [...offset.map((p) => [...p])]
        for (let i = 0; i < offset.length; i++) {
          const sinForZ = Math.sin(time * 0.01 + (i / offset.length - 0.5) * Math.PI * 13) * 10
          const z = offset[i][2] + sinForZ
          newOffset[i][2] = z
        }

        offsetBuffer.subdata(newOffset)

        drawSpheres([
          {
            position: [0, 0, 0],
            fbo: bgFbo,
            ...settings.sphere,
          },
        ])
      },
    )
  }