import mat4 from 'gl-mat4'

const cameraProps = {
  fov: Math.PI / 4.0,
  projectionMatrix: new Float32Array(16),
  viewMatrix: new Float32Array(16),
  cameraPosition: [0, 0, 0],
}

export const createSetupCamera = ({
  regl,
}) => regl({
  context: {
    projectionMatrix: function ({ viewportWidth, viewportHeight }) {
      return mat4.perspective(this.projectionMatrix, this.fov, viewportWidth / viewportHeight, 0.01, 1000.0)
    },
    viewMatrix: function (_, { cameraPosition, target }) {
      return mat4.lookAt(this.viewMatrix, cameraPosition, target, [0, 1, 0])
    },
    cameraPosition: regl.prop('cameraPosition'),
  },
}).bind(cameraProps)
