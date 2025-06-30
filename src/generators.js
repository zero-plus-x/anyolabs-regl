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

// Project existing points onto sphere surface
export const generateSphereFromPoints = (existingPositions, radius = 1.0, jitterAmount = 0.05) => {
  const count = existingPositions.length / 3
  const positions = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    const baseIndex = i * 3
    
    // Get the original point
    const x = existingPositions[baseIndex]
    const y = existingPositions[baseIndex + 1]
    const z = existingPositions[baseIndex + 2]
    
    // Calculate distance from origin
    const distance = Math.sqrt(x * x + y * y + z * z)
    
    // Handle the case where point is at origin
    if (distance === 0) {
      // Generate a random point on sphere surface
      const theta = Math.acos(2 * Math.random() - 1)
      const phi = 2 * Math.PI * Math.random()
      const sinTheta = Math.sin(theta)
      
      positions[baseIndex] = radius * sinTheta * Math.cos(phi)
      positions[baseIndex + 1] = radius * Math.cos(theta)
      positions[baseIndex + 2] = radius * sinTheta * Math.sin(phi)
    } else {
      // Normalize to unit sphere and scale by radius
      const scale = radius / distance
      positions[baseIndex] = x * scale
      positions[baseIndex + 1] = y * scale
      positions[baseIndex + 2] = z * scale
    }
    
    // Apply jitter if specified
    if (jitterAmount > 0) {
      // Generate tangential jitter (perpendicular to radial direction)
      const nx = positions[baseIndex]
      const ny = positions[baseIndex + 1]
      const nz = positions[baseIndex + 2]
      
      // Create two orthogonal tangent vectors
      let tx, ty, tz, bx, by, bz
      
      // Choose a vector that's not parallel to the normal
      if (Math.abs(nx) < 0.9) {
        tx = 0; ty = -nz; tz = ny
      } else {
        tx = -nz; ty = 0; tz = nx
      }
      
      // Normalize first tangent vector
      const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz)
      tx /= tLen; ty /= tLen; tz /= tLen
      
      // Cross product to get second tangent vector
      bx = ny * tz - nz * ty
      by = nz * tx - nx * tz
      bz = nx * ty - ny * tx
      
      // Apply random jitter in tangent plane
      const jitterT = (Math.random() - 0.5) * jitterAmount
      const jitterB = (Math.random() - 0.5) * jitterAmount
      
      positions[baseIndex] += jitterT * tx + jitterB * bx
      positions[baseIndex + 1] += jitterT * ty + jitterB * by
      positions[baseIndex + 2] += jitterT * tz + jitterB * bz
      
      // Re-normalize to maintain sphere surface
      const newDistance = Math.sqrt(
        positions[baseIndex] * positions[baseIndex] +
        positions[baseIndex + 1] * positions[baseIndex + 1] +
        positions[baseIndex + 2] * positions[baseIndex + 2]
      )
      const newScale = radius / newDistance
      positions[baseIndex] *= newScale
      positions[baseIndex + 1] *= newScale
      positions[baseIndex + 2] *= newScale
    }
  }
  
  return positions
}

// Match points from first array to closest/furthest points in second array (no reuse)
export const proximityGenerator = (firstArray, secondArray, useFurthest = false, candidateCount = 1) => {
  if (firstArray.length !== secondArray.length) {
    throw new Error('Arrays must have the same length')
  }
  
  const count = firstArray.length / 3
  const result = new Float32Array(firstArray.length)
  
  // Create array of available indices from second array
  const availableIndices = Array.from({ length: count }, (_, i) => i)
  
  // For each point in first array, find closest/furthest available points in second array
  for (let i = 0; i < count; i++) {
    const firstPoint = [
      firstArray[i * 3],
      firstArray[i * 3 + 1], 
      firstArray[i * 3 + 2]
    ]
    
    // Calculate distances to all available points
    const candidates = []
    
    for (let j = 0; j < availableIndices.length; j++) {
      const secondIndex = availableIndices[j]
      const secondPoint = [
        secondArray[secondIndex * 3],
        secondArray[secondIndex * 3 + 1],
        secondArray[secondIndex * 3 + 2]
      ]
      
      // Calculate squared distance (faster than sqrt)
      const dx = firstPoint[0] - secondPoint[0]
      const dy = firstPoint[1] - secondPoint[1]
      const dz = firstPoint[2] - secondPoint[2]
      const distanceSquared = dx * dx + dy * dy + dz * dz
      
      candidates.push({
        distance: distanceSquared,
        secondIndex: secondIndex,
        availableIndex: j
      })
    }
    
    // Sort candidates by distance
    candidates.sort((a, b) => useFurthest ? (b.distance - a.distance) : (a.distance - b.distance))
    
    // Pick randomly from the top candidateCount candidates
    const numCandidates = Math.min(candidateCount, candidates.length)
    const randomIndex = Math.floor(Math.random() * numCandidates)
    const chosen = candidates[randomIndex]
    
    // Copy the chosen point to result
    result[i * 3] = secondArray[chosen.secondIndex * 3]
    result[i * 3 + 1] = secondArray[chosen.secondIndex * 3 + 1]
    result[i * 3 + 2] = secondArray[chosen.secondIndex * 3 + 2]
    
    // Remove the used index from available indices
    availableIndices.splice(chosen.availableIndex, 1)
  }
  
  return result
}

// Shuffle the order of points in a 3D position array
export const shufflePositions = (positions, seededRandom = Math.random) => {
  const count = positions.length / 3
  const shuffled = new Float32Array(positions.length)
  
  // Copy original positions
  for (let i = 0; i < positions.length; i++) {
    shuffled[i] = positions[i]
  }
  
  // Fisher-Yates shuffle algorithm for 3D points
  for (let i = count - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(seededRandom() * (i + 1))
    
    // Swap points at indices i and j
    const baseI = i * 3
    const baseJ = j * 3
    
    // Swap x, y, z components
    for (let k = 0; k < 3; k++) {
      const temp = shuffled[baseI + k]
      shuffled[baseI + k] = shuffled[baseJ + k]
      shuffled[baseJ + k] = temp
    }
  }
  
  return shuffled
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

  // ... existing code ...

export const generateCubeSurface = (count, jitterAmount = 0.05) => {
  const positions = new Float32Array(count * 3)
  
  // Define the 6 faces of a unit cube in snake order
  // Top: 0, Right: 1, Front: 2, Left: 3, Back: 4, Bottom: 5
  const faces = [
    // Top face (y = 0.5)
    { normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], offset: [0, 0.5, 0] },
    // Right face (x = 0.5)
    { normal: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], offset: [0.5, 0, 0] },
    // Front face (z = 0.5)
    { normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], offset: [0, 0, 0.5] },
    // Left face (x = -0.5)
    { normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], offset: [-0.5, 0, 0] },
    // Back face (z = -0.5)
    { normal: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], offset: [0, 0, -0.5] },
    // Bottom face (y = -0.5)
    { normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], offset: [0, -0.5, 0] }
  ]
  
  // Calculate optimal snake path dimensions
  const totalArea = 6 // 6 faces of unit area each
  const density = count / totalArea
  const baseResolution = Math.ceil(Math.sqrt(density))
  
  // Calculate total ribbon length (each face contributes resolution^2 points in snake pattern)
  const pointsPerFace = baseResolution * baseResolution
  const totalRibbonLength = pointsPerFace * 6
  
  // Function to convert snake path coordinates to UV coordinates
  // Place points at corners to cover full surface including edges
  const snakeToUV = (snakeIndex, resolution) => {
    const row = Math.floor(snakeIndex / resolution)
    const col = snakeIndex % resolution
    
    // Snake pattern: alternate direction each row
    const actualCol = (row % 2 === 0) ? col : (resolution - 1 - col)
    
    // Map to UV coordinates to cover full surface from -0.5 to +0.5
    // The key fix: ensure we reach the +0.5 boundary by using (resolution-1) as divisor
    const u = (resolution === 1) ? 0 : (actualCol / (resolution - 1)) - 0.5
    const v = (resolution === 1) ? 0 : (row / (resolution - 1)) - 0.5
    
    return { u, v }
  }
  
  // Distribute points evenly along the ribbon
  for (let i = 0; i < count; i++) {
    // Calculate position along the continuous ribbon (0 to 1)
    const ribbonPosition = i / count
    
    // Convert ribbon position to face and local position
    const scaledPosition = ribbonPosition * totalRibbonLength
    const faceIndex = Math.floor(scaledPosition / pointsPerFace)
    const localSnakeIndex = Math.floor(scaledPosition % pointsPerFace)
    
    // Ensure we don't go out of bounds
    const clampedFaceIndex = Math.min(faceIndex, 5)
    const face = faces[clampedFaceIndex]
    
    // Convert snake index to UV coordinates (at corners to cover full surface)
    let { u, v } = snakeToUV(localSnakeIndex, baseResolution)
    
    // Apply smart jitter based on point location
    if (jitterAmount > 0) {
      // Check if point is on an edge (with small tolerance)
      const tolerance = 0.001
      const isOnLeftEdge = Math.abs(u + 0.5) < tolerance
      const isOnRightEdge = Math.abs(u - 0.5) < tolerance
      const isOnBottomEdge = Math.abs(v + 0.5) < tolerance
      const isOnTopEdge = Math.abs(v - 0.5) < tolerance
      const isOnCorner = (isOnLeftEdge || isOnRightEdge) && (isOnBottomEdge || isOnTopEdge)
      
      if (isOnCorner) {
        // Corner points don't jitter at all
      } else if (isOnTopEdge || isOnBottomEdge) {
        // Horizontal edge points can only jitter along u direction
        const maxJitter = Math.min(0.5 + u, 0.5 - u)
        const jitterU = (Math.random() - 0.5) * jitterAmount * Math.min(maxJitter * 2, 0.8)
        u = Math.max(-0.5, Math.min(0.5, u + jitterU))
      } else if (isOnLeftEdge || isOnRightEdge) {
        // Vertical edge points can only jitter along v direction
        const maxJitter = Math.min(0.5 + v, 0.5 - v)
        const jitterV = (Math.random() - 0.5) * jitterAmount * Math.min(maxJitter * 2, 0.8)
        v = Math.max(-0.5, Math.min(0.5, v + jitterV))
      } else {
        // Interior points get full 2D jitter with boundary constraints
        const maxJitterU = Math.min(0.5 + u, 0.5 - u)
        const maxJitterV = Math.min(0.5 + v, 0.5 - v)
        
        const jitterU = (Math.random() - 0.5) * jitterAmount * Math.min(maxJitterU * 2, 1.0)
        const jitterV = (Math.random() - 0.5) * jitterAmount * Math.min(maxJitterV * 2, 1.0)
        
        u = Math.max(-0.5, Math.min(0.5, u + jitterU))
        v = Math.max(-0.5, Math.min(0.5, v + jitterV))
      }
    }
    
    // Convert UV coordinates to 3D position on the face
    const x = face.offset[0] + u * face.u[0] + v * face.v[0]
    const y = face.offset[1] + u * face.u[1] + v * face.v[1]
    const z = face.offset[2] + u * face.u[2] + v * face.v[2]
    
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
  }
  
  return positions
}

// ... existing code ...
