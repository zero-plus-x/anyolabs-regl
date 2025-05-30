
export const generateFibonacciSphere = (count, jitterAmount = 0.05) => {
    const positions = new Float32Array(count * 3)
  
    for (let i = 0; i < count; i++) {
      // Generate random radius to fill the volume (cube root for uniform density)
      const radius = Math.pow(Math.random(), 1 / 3)
  
      // Use Fibonacci sphere algorithm for even angular distribution
      const offset = 2.0 / count
      const y = i * offset - 1 + offset / 2
      const r = Math.sqrt(1 - y * y)
      const phi = i * (Math.PI * (3 - Math.sqrt(5))) // Golden angle
  
      // Convert to Cartesian coordinates and scale by radius
      const x = Math.cos(phi) * r * radius
      const z = Math.sin(phi) * r * radius
      const scaledY = y * radius
  
      // Add some randomness to avoid perfect patterns
      const jitter = jitterAmount
      positions[i * 3] = x + (Math.random() - 0.5) * jitter
      positions[i * 3 + 1] = scaledY + (Math.random() - 0.5) * jitter
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * jitter
    }
  
    return positions
  }
  
  export const generateUniformSphere = (count, jitterAmount = 0.05) => {
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Use improved spiral method for uniform distribution
      // Based on Saff & Kuijlaars algorithm for equal area distribution
      const k = i + 0.5
      const h = -1 + 2 * k / count  // height on sphere from -1 to 1
      const theta = Math.acos(h)    // polar angle
      
      // Calculate phi using golden ratio for optimal spiral
      const phi = (i % count) * Math.PI * (3 - Math.sqrt(5)) // golden angle
      
      // Convert to Cartesian coordinates
      const sinTheta = Math.sin(theta)
      const x = sinTheta * Math.cos(phi)
      const y = h  // cos(theta) = h
      const z = sinTheta * Math.sin(phi)
      
      // Add minimal jitter to avoid perfect patterns while maintaining uniformity
      const jitter = jitterAmount
      positions[i * 3] = x + (Math.random() - 0.5) * jitter
      positions[i * 3 + 1] = y + (Math.random() - 0.5) * jitter
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * jitter
    }
    
    return positions
  }
  
  export const generateCurvatureAwareGridSphere = (count, jitterAmount = 0.05) => {
    const positions = new Float32Array(count * 3)
    
    // Calculate grid dimensions - start with square grid as base
    const baseResolution = Math.ceil(Math.sqrt(count))
    const latitudeBands = baseResolution
    const longitudeSegments = Math.ceil(count / latitudeBands)
    
    let index = 0
    for (let lat = 0; lat < latitudeBands && index < count; lat++) {
      // Calculate latitude position with equal area distribution
      // Use cosine distribution to account for sphere curvature
      const v = (lat + 0.5) / latitudeBands
      const theta = Math.acos(1 - 2 * v)  // polar angle with equal area
      
      // Calculate how many longitude segments we need for this latitude
      // At poles (sin(theta) ≈ 0), we need fewer points
      // At equator (sin(theta) ≈ 1), we need more points
      const circumference = Math.sin(theta)
      const adjustedLongSegments = Math.max(1, Math.round(longitudeSegments * circumference))
      
      for (let lon = 0; lon < adjustedLongSegments && index < count; lon++) {
        // Distribute longitude points evenly around this latitude band
        const u = (lon + 0.5) / adjustedLongSegments
        const phi = u * 2 * Math.PI  // azimuth angle
        
        // Convert to Cartesian coordinates
        const sinTheta = Math.sin(theta)
        const x = sinTheta * Math.cos(phi)
        const y = Math.cos(theta)  // y is up
        const z = sinTheta * Math.sin(phi)
        
        // Add jitter to break up perfect grid patterns
        const jitter = jitterAmount
        positions[index * 3] = x + (Math.random() - 0.5) * jitter
        positions[index * 3 + 1] = y + (Math.random() - 0.5) * jitter
        positions[index * 3 + 2] = z + (Math.random() - 0.5) * jitter
        
        index++
      }
    }
    
    return positions
  }
  
/* Function to distort a sphere with noise.
Example:
const distortedSphere = distortSphere(sphere, {
  scale: 5.5,
  noiseStrength: 0.25,
  offsetX: 5.0,
  offsetY: 2.5,
  offsetZ: 1.0,
  addRidges: true,
  ridgeThreshold: 0.2,
  ridgeStrength: 0.1,
})
*/
export const distortSphere = (basePositions, options = {}) => {
  const {
    scale = 6.0,
    noiseStrength = 0.25,
    offsetX = 0,
    offsetY = 0,
    offsetZ = 0,
    addRidges = false,
    ridgeThreshold = 0.2,
    ridgeStrength = 0.1,
  } = options

  const count = basePositions.length / 3
  const distorted = new Float32Array(basePositions.length)

  for (let i = 0; i < count; i++) {
    const idx = i * 3
    const x = basePositions[idx]
    const y = basePositions[idx + 1]
    const z = basePositions[idx + 2]

    // Get noise value based on position with optional offsets
    const noiseValue = noise3D(x * scale + offsetX, y * scale + offsetY, z * scale + offsetZ)

    // Calculate normal (normalized position for a sphere)
    const length = Math.sqrt(x * x + y * y + z * z)
    const nx = x / length
    const ny = y / length
    const nz = z / length

    // Apply basic distortion along the normal
    distorted[idx] = x + nx * noiseValue * noiseStrength
    distorted[idx + 1] = y + ny * noiseValue * noiseStrength
    distorted[idx + 2] = z + nz * noiseValue * noiseStrength

    // Optionally add ridge features
    if (addRidges && noiseValue > ridgeThreshold) {
      distorted[idx] += nx * ridgeStrength
      distorted[idx + 1] += ny * ridgeStrength
      distorted[idx + 2] += nz * ridgeStrength
    }
  }

  return distorted
}
