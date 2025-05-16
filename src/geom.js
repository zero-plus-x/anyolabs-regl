export const decodePoints = (buffer) => {
  let offset = 0

  // Read COUNT (1 Float32, 4 bytes)
  const countArray = new Float32Array(buffer, offset, 1)
  const count = countArray[0]
  offset += 4

  console.log('COUNT', buffer)

  // Read POS_MIN (3 Float32, 12 bytes)
  const posMin = new Float32Array(buffer, offset, 3)
  offset += 12

  // Read POS_MAX (3 Float32, 12 bytes)
  const posMax = new Float32Array(buffer, offset, 3)
  offset += 12

  // Read the raw position data: count * 3 Int8 values
  const numRawValues = count * 3
  const posRaw = new Int8Array(buffer, offset, numRawValues)

  // Allocate space for the mapped positions as Float32 values.
  const posMapped = new Float32Array(numRawValues)

  // For each point (group of 3 values), map from the Int8 domain to
  // the desired range.
  for (let i = 0; i < numRawValues; i += 3) {
    posMapped[i] = posMin[0] + ((posRaw[i] + 128) / 255) * (posMax[0] - posMin[0])
    posMapped[i + 1] = posMin[1] + ((posRaw[i + 1] + 128) / 255) * (posMax[1] - posMin[1])
    posMapped[i + 2] = posMin[2] + ((posRaw[i + 2] + 128) / 255) * (posMax[2] - posMin[2])
  }

  return {
    COUNT: count,
    POS: posMapped,
    POS_MIN: posMin,
    POS_MAX: posMax,
  }
}

export const shuffleAndColor = (arr, threshold) => {
  const colors = new Float32Array(arr.length / 3)
  colors.fill(1, threshold / 3, colors.length)

  for (let i = arr.length / 3 - 1; i > 0; i--) {
    const nextRandom = Math.random()
    const j = Math.floor(nextRandom * (i + 1))

    // Swap elements
    const iBase = i * 3
    const jBase = j * 3
    const t1 = arr[iBase],
      t2 = arr[iBase + 1],
      t3 = arr[iBase + 2]
    arr[iBase] = arr[jBase]
    arr[iBase + 1] = arr[jBase + 1]
    arr[iBase + 2] = arr[jBase + 2]
    arr[jBase] = t1
    arr[jBase + 1] = t2
    arr[jBase + 2] = t3

    const tmpCol = colors[i]
    colors[i] = colors[j]
    colors[j] = tmpCol
  }
  return colors
}
