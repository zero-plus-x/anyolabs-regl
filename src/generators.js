export const generateUniformSphere = (count, jitterAmount = 0.05) => {
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    // Use improved spiral method for uniform distribution
    // Based on Saff & Kuijlaars algorithm for equal area distribution
    const k = i + 0.5
    const h = -1 + (2 * k) / count // height on sphere from -1 to 1
    const theta = Math.acos(h) // polar angle

    // Calculate phi using golden ratio for optimal spiral
    const phi = (i % count) * Math.PI * (3 - Math.sqrt(5)) // golden angle

    // Convert to Cartesian coordinates
    const sinTheta = Math.sin(theta)
    const x = sinTheta * Math.cos(phi)
    const y = h // cos(theta) = h
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
    const theta = Math.acos(1 - 2 * v) // polar angle with equal area

    // Calculate how many longitude segments we need for this latitude
    // At poles (sin(theta) ≈ 0), we need fewer points
    // At equator (sin(theta) ≈ 1), we need more points
    const circumference = Math.sin(theta)
    const adjustedLongSegments = Math.max(1, Math.round(longitudeSegments * circumference))

    for (let lon = 0; lon < adjustedLongSegments && index < count; lon++) {
      // Distribute longitude points evenly around this latitude band
      const u = (lon + 0.5) / adjustedLongSegments
      const phi = u * 2 * Math.PI // azimuth angle

      // Convert to Cartesian coordinates
      const sinTheta = Math.sin(theta)
      const x = sinTheta * Math.cos(phi)
      const y = Math.cos(theta) // y is up
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
} // ... existing code ...

export const generateVolumeSphere = (count, jitterAmount = 0.05) => {
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    // Generate random radius with cube root distribution for uniform volume density
    // This ensures points are distributed evenly throughout the volume, not concentrated at center
    const radius = Math.pow(Math.random(), 1 / 3)

    // Generate random angles for uniform angular distribution
    const theta = Math.acos(2 * Math.random() - 1) // polar angle [0, π]
    const phi = 2 * Math.PI * Math.random() // azimuthal angle [0, 2π]

    // Convert spherical to Cartesian coordinates
    const sinTheta = Math.sin(theta)
    const x = radius * sinTheta * Math.cos(phi)
    const y = radius * Math.cos(theta)
    const z = radius * sinTheta * Math.sin(phi)

    // Apply jitter to break up any patterns
    const jitter = jitterAmount
    positions[i * 3] = x + (Math.random() - 0.5) * jitter
    positions[i * 3 + 1] = y + (Math.random() - 0.5) * jitter
    positions[i * 3 + 2] = z + (Math.random() - 0.5) * jitter
  }

  return positions
}

// Alternative approach using rejection sampling for perfect sphere bounds
export const generateVolumeSpherePerfect = (count, jitterAmount = 0.05) => {
  const positions = new Float32Array(count * 3)

  let i = 0
  while (i < count) {
    // Generate random point in cube [-1, 1]³
    const x = 2 * Math.random() - 1
    const y = 2 * Math.random() - 1
    const z = 2 * Math.random() - 1

    // Check if point is inside unit sphere
    const distanceSquared = x * x + y * y + z * z
    if (distanceSquared <= 1.0) {
      // Point is inside sphere, add it with jitter
      const jitter = jitterAmount
      positions[i * 3] = x + (Math.random() - 0.5) * jitter
      positions[i * 3 + 1] = y + (Math.random() - 0.5) * jitter
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * jitter
      i++
    }
    // If point is outside sphere, reject it and try again
  }

  return positions
}

// ... existing code ...

export const generateCenterWeightedVolumeSphere = (count, jitterAmount = 0.05, centerBias = 0.3) => {
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Create center-weighted radius distribution
      // Lower centerBias values = more concentration toward center
      // centerBias = 0.33 gives uniform volume distribution
      // centerBias = 0.1 gives strong center concentration
      // centerBias = 0.5 gives more edge concentration
      const radius = Math.pow(Math.random(), centerBias)
      
      // Generate uniform angular distribution
      const theta = Math.acos(2 * Math.random() - 1) // polar angle [0, π]
      const phi = 2 * Math.PI * Math.random()        // azimuthal angle [0, 2π]
      
      // Convert spherical to Cartesian coordinates
      const sinTheta = Math.sin(theta)
      const x = radius * sinTheta * Math.cos(phi)
      const y = radius * Math.cos(theta)
      const z = radius * sinTheta * Math.sin(phi)
      
      // Apply jitter to break up any patterns
      const jitter = jitterAmount
      positions[i * 3] = x + (Math.random() - 0.5) * jitter
      positions[i * 3 + 1] = y + (Math.random() - 0.5) * jitter
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * jitter
    }
    
    return positions
  }
  
  // Alternative with more sophisticated density control
  export const generateGradientVolumeSphere = (count, jitterAmount = 0.05, densityPower = 2.0) => {
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Create custom density gradient
      // Higher densityPower = more concentration toward center
      // densityPower = 1.0 gives linear falloff
      // densityPower = 2.0 gives quadratic falloff (nice default)
      // densityPower = 3.0 gives strong center concentration
      
      let radius
      if (densityPower === 1.0) {
        // Linear density falloff
        radius = 1.0 - Math.random()
      } else {
        // Power-law density falloff
        const u = Math.random()
        radius = Math.pow(1.0 - Math.pow(u, 1.0 / densityPower), 1.0 / 3.0)
      }
      
      // Generate uniform angular distribution
      const theta = Math.acos(2 * Math.random() - 1)
      const phi = 2 * Math.PI * Math.random()
      
      // Convert to Cartesian coordinates
      const sinTheta = Math.sin(theta)
      const x = radius * sinTheta * Math.cos(phi)
      const y = radius * Math.cos(theta)
      const z = radius * sinTheta * Math.sin(phi)
      
      // Apply jitter
      const jitter = jitterAmount
      const offset = (Math.random() - 0.5) * jitter
      positions[i * 3] = x +  offset
      positions[i * 3 + 1] = y + offset
      positions[i * 3 + 2] = z + offset
    }
    
    return positions
  }
  
  // Hybrid approach: uniform base + center-weighted overlay
  export const generateLayeredVolumeSphere = (count, jitterAmount = 0.05, coreRatio = 0.6, coreParticleRatio = 0.7) => {
    const positions = new Float32Array(count * 3)
    
    // Split particles between core and shell
    const coreParticles = Math.floor(count * coreParticleRatio)
    const shellParticles = count - coreParticles
    
    let index = 0
    
    // Generate core particles (more dense, smaller radius)
    for (let i = 0; i < coreParticles; i++) {
      const radius = Math.pow(Math.random(), 0.5) * coreRatio // Concentrated in inner sphere
      
      const theta = Math.acos(2 * Math.random() - 1)
      const phi = 2 * Math.PI * Math.random()
      
      const sinTheta = Math.sin(theta)
      const x = radius * sinTheta * Math.cos(phi)
      const y = radius * Math.cos(theta)
      const z = radius * sinTheta * Math.sin(phi)
      
      const jitter = jitterAmount
      positions[index * 3] = x + (Math.random() - 0.5) * jitter
      positions[index * 3 + 1] = y + (Math.random() - 0.5) * jitter
      positions[index * 3 + 2] = z + (Math.random() - 0.5) * jitter
      index++
    }
    
    // Generate shell particles (less dense, outer region)
    for (let i = 0; i < shellParticles; i++) {
      const radius = coreRatio + Math.pow(Math.random(), 0.8) * (1.0 - coreRatio) // Outer shell
      
      const theta = Math.acos(2 * Math.random() - 1)
      const phi = 2 * Math.PI * Math.random()
      
      const sinTheta = Math.sin(theta)
      const x = radius * sinTheta * Math.cos(phi)
      const y = radius * Math.cos(theta)
      const z = radius * sinTheta * Math.sin(phi)
      
      const jitter = jitterAmount
      positions[index * 3] = x + (Math.random() - 0.5) * jitter
      positions[index * 3 + 1] = y + (Math.random() - 0.5) * jitter
      positions[index * 3 + 2] = z + (Math.random() - 0.5) * jitter
      index++
    }
    
    return positions
  }