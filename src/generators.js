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

// Shuffle the order of components in an array
export const shuffleComponents = (array, componentsPerElement, seededRandom = Math.random) => {
  const count = array.length / componentsPerElement
  const shuffled = new Float32Array(array.length)
  
  // Copy original array
  for (let i = 0; i < array.length; i++) {
    shuffled[i] = array[i]
  }
  
  // Fisher-Yates shuffle algorithm for components
  for (let i = count - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(seededRandom() * (i + 1))
    
    // Swap components at indices i and j
    const baseI = i * componentsPerElement
    const baseJ = j * componentsPerElement
    
    // Swap all components for this element
    for (let k = 0; k < componentsPerElement; k++) {
      const temp = shuffled[baseI + k]
      shuffled[baseI + k] = shuffled[baseJ + k]
      shuffled[baseJ + k] = temp
    }
  }
  
  return shuffled
}

// Shuffle the order of points in a 3D position array (legacy function)
export const shufflePositions = (positions, seededRandom = Math.random) => {
  return shuffleComponents(positions, 3, seededRandom)
}

// Shuffle multiple arrays with the same component order
export const shuffleMultipleArrays = (arrays, componentsPerElement, seededRandom = Math.random) => {
  if (arrays.length === 0) return []
  
  // Calculate number of elements based on first array and components per element
  const count = arrays[0].length / componentsPerElement
  
  // Verify all arrays have the same number of elements
  for (let i = 1; i < arrays.length; i++) {
    if (arrays[i].length !== arrays[0].length) {
      throw new Error('All arrays must have the same length')
    }
  }
  
  // Create shuffled copies of all arrays
  const shuffledArrays = arrays.map(array => new Float32Array(array.length))
  
  // Copy original arrays
  for (let i = 0; i < arrays.length; i++) {
    for (let j = 0; j < arrays[i].length; j++) {
      shuffledArrays[i][j] = arrays[i][j]
    }
  }
  
  // Generate shuffle order once and apply to all arrays
  const shuffleOrder = Array.from({ length: count }, (_, i) => i)
  
  // Fisher-Yates shuffle for the order
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    const temp = shuffleOrder[i]
    shuffleOrder[i] = shuffleOrder[j]
    shuffleOrder[j] = temp
  }
  
  // Apply the same shuffle order to all arrays
  for (let arrayIndex = 0; arrayIndex < arrays.length; arrayIndex++) {
    const originalArray = new Float32Array(arrays[arrayIndex])
    
    for (let i = 0; i < count; i++) {
      const sourceIndex = shuffleOrder[i]
      const targetIndex = i
      
      // Copy all components for this element
      for (let k = 0; k < componentsPerElement; k++) {
        shuffledArrays[arrayIndex][targetIndex * componentsPerElement + k] = 
          originalArray[sourceIndex * componentsPerElement + k]
      }
    }
  }
  
  return shuffledArrays
}

// Generate RGBA colors based on distance from center (same algorithm as sphere generator)
export const generateColorsByDistToCenter = (positions) => {
  const count = positions.length / 3
  const colors = new Float32Array(count * 4)
  
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3]
    const y = positions[i * 3 + 1]
    const z = positions[i * 3 + 2]
    
    // Calculate distance from center
    const distance = Math.sqrt(x * x + y * y + z * z)
    
    // Set white color with distance-based alpha
    // Distance from center (0 at center, approaches 1 at surface)
    const alpha = distance
    
    colors[i * 4] = 1.0     // R - white
    colors[i * 4 + 1] = 1.0 // G - white  
    colors[i * 4 + 2] = 1.0 // B - white
    colors[i * 4 + 3] = alpha // A - distance-based
  }
  
  return colors
}

// Generate size values from 0 to 1 using smooth noise based on position
export const generateSizeByPosition = (positions, noiseFrequency = 1.0) => {
  const count = positions.length / 3
  const sizes = new Float32Array(count)
  
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3] * noiseFrequency
    const y = positions[i * 3 + 1] * noiseFrequency
    const z = positions[i * 3 + 2] * noiseFrequency
    
    // Use simple 3D Perlin-like noise
    const noiseValue = smoothNoise3D(x, y, z)
    
    // Map noise from [-1, 1] to [0, 1]
    const normalizedValue = (noiseValue + 1.0) * 0.5
    
    sizes[i] = Math.max(0, Math.min(1, normalizedValue))
  }
  
  return sizes
}

// Simple 3D smooth noise implementation (Perlin-like)
const smoothNoise3D = (x, y, z) => {
  // Get integer coordinates
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const Z = Math.floor(z) & 255
  
  // Get fractional parts
  x -= Math.floor(x)
  y -= Math.floor(y)
  z -= Math.floor(z)
  
  // Smooth the fractional parts
  const u = fade(x)
  const v = fade(y)
  const w = fade(z)
  
  // Hash coordinates of the 8 cube corners
  const A = (permTable[X] + Y) & 255
  const B = (permTable[X + 1] + Y) & 255
  const AA = (permTable[A] + Z) & 255
  const AB = (permTable[A + 1] + Z) & 255
  const BA = (permTable[B] + Z) & 255
  const BB = (permTable[B + 1] + Z) & 255
  
  // Blend the results from 8 corners of the cube
  return lerp(w,
    lerp(v,
      lerp(u, grad3D(permTable[AA], x, y, z), grad3D(permTable[BA], x - 1, y, z)),
      lerp(u, grad3D(permTable[AB], x, y - 1, z), grad3D(permTable[BB], x - 1, y - 1, z))
    ),
    lerp(v,
      lerp(u, grad3D(permTable[AA + 1], x, y, z - 1), grad3D(permTable[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad3D(permTable[AB + 1], x, y - 1, z - 1), grad3D(permTable[BB + 1], x - 1, y - 1, z - 1))
    )
  )
}

// Helper functions for noise
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const lerp = (t, a, b) => a + t * (b - a)
const grad3D = (hash, x, y, z) => {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

// Permutation table for noise
const permTable = new Array(512)
const permutation = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21,
  10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149,
  56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229,
  122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209,
  76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
  226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
  223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
  108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179,
  162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50,
  45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
]

// Initialize permutation table
for (let i = 0; i < 256; i++) {
  permTable[i] = permTable[i + 256] = permutation[i]
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
  export const generateVolumeSphere = (count, jitterAmount = 0.05) => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 4) // RGBA
    
    // Calculate 3D grid dimensions to fit count points
    // We'll generate more points than needed and filter to get exactly count points
    const gridSize = Math.ceil(Math.pow(count * 1.5, 1.0 / 3.0)) // Generate extra to account for filtering
    
    const validPoints = []
    
    // Generate all grid points and filter valid ones
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          // Create evenly spaced grid coordinates in [-1, 1] cube
          const gridX = gridSize === 1 ? 0 : (2 * x / (gridSize - 1)) - 1
          const gridY = gridSize === 1 ? 0 : (2 * y / (gridSize - 1)) - 1
          const gridZ = gridSize === 1 ? 0 : (2 * z / (gridSize - 1)) - 1
          
          // Calculate distance from center for this grid point
          const originalRadius = Math.sqrt(gridX * gridX + gridY * gridY + gridZ * gridZ)
          
          // Only include points that are within unit sphere
          if (originalRadius <= 1.0) {
            // Calculate direction vector (normalized grid position)
            let dirX, dirY, dirZ
            if (originalRadius === 0) {
              // Center point - no direction needed
              dirX = dirY = dirZ = 0
            } else {
              dirX = gridX / originalRadius
              dirY = gridY / originalRadius
              dirZ = gridZ / originalRadius
            }
            
            // Apply 3D spherical jitter - move point by distance and two angles
            let finalX = gridX, finalY = gridY, finalZ = gridZ
            
            if (jitterAmount > 0 && originalRadius > 0) {
              // Generate jitter in spherical coordinates
              const jitterDistance = (Math.random() - 0.5) * jitterAmount
              const jitterTheta = (Math.random() - 0.5) * jitterAmount * Math.PI // polar angle jitter
              const jitterPhi = (Math.random() - 0.5) * jitterAmount * 2 * Math.PI // azimuthal angle jitter
              
              // Convert original position to spherical coordinates
              const originalTheta = Math.acos(gridY / originalRadius) // polar angle
              const originalPhi = Math.atan2(gridZ, gridX) // azimuthal angle
              
              // Apply jitter to spherical coordinates
              const newRadius = Math.max(0, Math.min(originalRadius + jitterDistance, 1.0))
              const newTheta = Math.max(0, Math.min(originalTheta + jitterTheta, Math.PI))
              const newPhi = originalPhi + jitterPhi
              
              // Convert back to Cartesian coordinates
              const sinTheta = Math.sin(newTheta)
              finalX = newRadius * sinTheta * Math.cos(newPhi)
              finalY = newRadius * Math.cos(newTheta)
              finalZ = newRadius * sinTheta * Math.sin(newPhi)
              
              // Ensure we stay within unit sphere
              const finalRadius = Math.sqrt(finalX * finalX + finalY * finalY + finalZ * finalZ)
              if (finalRadius > 1.0) {
                const scale = 1.0 / finalRadius
                finalX *= scale
                finalY *= scale
                finalZ *= scale
              }
            }
            
            // Generate white RGBA color with alpha based on distance from center
            const distance = Math.sqrt(finalX * finalX + finalY * finalY + finalZ * finalZ)
            const alpha = distance // Distance from center (0 at center, 1 at surface)
            
            // Store the valid point with white color and distance-based alpha
            validPoints.push([finalX, finalY, finalZ, 1.0, 1.0, 1.0, alpha])
          }
        }
      }
    }
    
    // If we don't have enough valid points, fill with random points
    while (validPoints.length < count) {
      // Generate random point in unit sphere using rejection sampling
      let x, y, z, radiusSquared
      do {
        x = 2 * Math.random() - 1
        y = 2 * Math.random() - 1
        z = 2 * Math.random() - 1
        radiusSquared = x * x + y * y + z * z
      } while (radiusSquared > 1.0)
      
      // Apply 3D spherical jitter
      if (jitterAmount > 0) {
        const radius = Math.sqrt(radiusSquared)
        if (radius > 0) {
          // Generate jitter in spherical coordinates
          const jitterDistance = (Math.random() - 0.5) * jitterAmount
          const jitterTheta = (Math.random() - 0.5) * jitterAmount * Math.PI
          const jitterPhi = (Math.random() - 0.5) * jitterAmount * 2 * Math.PI
          
          // Convert to spherical coordinates
          const originalTheta = Math.acos(y / radius)
          const originalPhi = Math.atan2(z, x)
          
          // Apply jitter
          const newRadius = Math.max(0, Math.min(radius + jitterDistance, 1.0))
          const newTheta = Math.max(0, Math.min(originalTheta + jitterTheta, Math.PI))
          const newPhi = originalPhi + jitterPhi
          
          // Convert back to Cartesian
          const sinTheta = Math.sin(newTheta)
          x = newRadius * sinTheta * Math.cos(newPhi)
          y = newRadius * Math.cos(newTheta)
          z = newRadius * sinTheta * Math.sin(newPhi)
        }
      }
      
      // Generate white RGBA color for random points
      const distance = Math.sqrt(x * x + y * y + z * z)
      const alpha = distance // Distance from center (0 at center, 1 at surface)

      validPoints.push([x, y, z, 1.0, 1.0, 1.0, alpha])
    }
    
    // Take exactly count points and fill the positions and colors arrays
    for (let i = 0; i < count; i++) {
      const point = validPoints[i % validPoints.length]
      positions[i * 3] = point[0]
      positions[i * 3 + 1] = point[1]
      positions[i * 3 + 2] = point[2]
      
      // Use white RGB values directly (no HSV conversion needed)
      const r = point[3] // 1.0
      const g = point[4] // 1.0
      const b = point[5] // 1.0
      const a = point[6] // distance-based alpha
      
      colors[i * 4] = r
      colors[i * 4 + 1] = g
      colors[i * 4 + 2] = b
      colors[i * 4 + 3] = a
    }
    
    return { positions, colors }
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

export const generateCubeSurface = (count, jitterAmount = 0.05, edgeStickiness = true) => {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 4) // RGBA
  
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
    
    // Generate white color with alpha based on distance from edges
    // Calculate distance from center of face (0,0) in UV coordinates
    const distanceFromCenter = Math.sqrt(u * u + v * v)
    
    // Calculate distance to nearest edge
    const distanceToEdgeU = Math.min(0.5 + u, 0.5 - u) // distance to left/right edge
    const distanceToEdgeV = Math.min(0.5 + v, 0.5 - v) // distance to top/bottom edge
    const distanceToNearestEdge = Math.min(distanceToEdgeU, distanceToEdgeV)
    
    // Map distance to alpha: edges (distance=0) -> alpha=1.0, center (distance=0.5) -> alpha=0.0
    const alpha = 1.0 - (distanceToNearestEdge / 0.5)
    
    // Set white color (RGB = 1, 1, 1)
    colors[i * 4] = 1.0     // R
    colors[i * 4 + 1] = 1.0 // G
    colors[i * 4 + 2] = 1.0 // B
    colors[i * 4 + 3] = alpha
  }
  
  return { positions, colors }
}

// ... existing code ...
