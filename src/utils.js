export function createSeededRandom(seed) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646

  return function () {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

export function nextPowerOf2(n) {
  if (n < 1) return 1
  return 2 ** Math.ceil(Math.log2(n))
}

export function resizeRegl(canvas, regl, updateFBO) {
  const resizeObserver = new ResizeObserver(() => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height

      // Notify regl about the new size (optional for internal buffers)
      regl._gl.viewport(0, 0, width, height)

      // Recreate or resize framebuffers/textures here if needed
      updateFBO(width, height)
    }
  })

  resizeObserver.observe(canvas)
}
