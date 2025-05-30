import mat4 from 'gl-mat4'

const cameraProps = {
  baseFov: Math.PI / 4.0,
  projectionMatrix: new Float32Array(16),
  viewMatrix: new Float32Array(16),
  cameraPosition: [0, 0, 0],
}

export const createSetupCamera = ({
  regl,
}) => regl({
  context: {
    projectionMatrix: function ({ viewportWidth, viewportHeight }) {
      const aspectRatio = viewportWidth / viewportHeight
      
      // Calculate adaptive field of view to maintain 1:1 proportions regardless of canvas size
      // Scale FOV based on deviation from square aspect ratio (1:1)
      let adaptiveFov = this.baseFov
      
      if (aspectRatio < 1) {
        // Tall screen: increase vertical FOV
        adaptiveFov = this.baseFov / aspectRatio
      } else if (aspectRatio > 1) {
        // Wide screen: increase horizontal FOV by keeping the same vertical coverage
        // The perspective matrix will handle this automatically with the aspect ratio
        adaptiveFov = this.baseFov
      }
      
      return mat4.perspective(this.projectionMatrix, adaptiveFov, aspectRatio, 0.01, 1000.0)
    },
    viewMatrix: function (_, { cameraPosition, target }) {
      return mat4.lookAt(this.viewMatrix, cameraPosition, target, [0, 1, 0])
    },
    cameraPosition: regl.prop('cameraPosition'),
  },
}).bind(cameraProps)
