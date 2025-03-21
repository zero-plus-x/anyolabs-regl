// glass.frag
precision mediump float;

#include "lygia/generative/random.glsl"

uniform samplerCube envMap;

uniform float reflectionRoughness; // 0.0 = sharp, 1.0 = blurry
uniform float refractionRoughness; // 0.0 = sharp, 1.0 = blurry
uniform float refractiveIndex;     // e.g. 1.0 (air) / 1.5 (glass)

varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
uniform float iTime;
uniform float instanceIndex;

float sheen(vec3 N, vec3 V, float intensity, float power) {
    float facing = 1.0 - max(dot(N, V), 0.0); // More when facing away
    return intensity * pow(facing, power);   // Power controls falloff
}

void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(vViewDir);

    // Fake reflection (blur with random offset based on roughness)
    vec3 R = reflect(-V, N);
    vec3 randomOffsetR = random3(vWorldPos + R) * reflectionRoughness;
    vec3 blurredR = normalize(R + randomOffsetR);
    vec3 reflectionColor = textureCube(envMap, blurredR).rgb;

    // Fake refraction (bend view vector by normal * refractive index)
    vec3 refractedDir = refract(-V, N, 1.0 / refractiveIndex);
    vec3 randomOffsetT = random3(vWorldPos + refractedDir) * refractionRoughness;
    vec3 blurredT = normalize(refractedDir + randomOffsetT);
    vec3 refractionColor = textureCube(envMap, blurredT).rgb;

    // Fresnel (mix reflection and refraction based on angle)
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 color = mix(refractionColor, reflectionColor, fresnel);

    float sheenIntensity = 0.5 + 0.5 * sin(iTime * 0.0001 + instanceIndex);

    float sheenFactor = sheen(N, V, sheenIntensity, 4.0); // play with intensity and power
    vec3 sheenColor = vec3(0.1) * sheenFactor;

    color += sheenColor;

    gl_FragColor = vec4(color, 1.0); // Fake glass with env-based refraction & reflection
}