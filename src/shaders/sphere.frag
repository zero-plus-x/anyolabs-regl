precision highp float;
uniform vec3 tint;
uniform samplerCube envMap;
uniform mat3 normalMatrix;
varying vec3 eyeDir;
varying vec3 fragNormal;

varying vec3 vNormal;   // Incoming normal from vertex shader
varying vec3 vPosition; // Incoming position from vertex shader

void main() {
    vec3 uLightPosition = vec3(3.0, 10.0, 0.0); // Light position in world space
    vec3 uLightColor = vec3(1.0, 1.0, 1.0) / 5.;    // Light color
    vec3 uAmbientColor = vec3(0.1, 0.1, 0.1) * 5.;  // Ambient color
    vec3 uDiffuseColor = vec3(1.0, 1.0, 1.0) / 2.;  // Diffuse color
    vec3 uSpecularColor = vec3(1.0, 1.0, 1.0); // Specular color
    float uShininess = .0;    // Shininess factor
    // Normalize normal
    vec3 N = normalize(vNormal);

    vec3 R = reflect(normalize(eyeDir), N);
vec4 env = textureCube(envMap, R);    
    // Calculate light direction
    vec3 L = normalize(uLightPosition - vPosition);
    
    // Compute diffuse lighting (Lambert's cosine law)
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = uDiffuseColor * diff * uLightColor;
    
    // Compute specular reflection (Blinn-Phong)
    vec3 V = normalize(-vPosition); // View direction (from camera)
    vec3 H = normalize(L + V); // Halfway vector
    float spec = pow(max(dot(N, H), 0.0), uShininess);
    vec3 specular = uSpecularColor * spec * uLightColor;

    // Combine ambient, diffuse, and specular
    vec4 finalColor = vec4(uAmbientColor + diffuse + specular, 1.0);

    float fresnel = pow(1.0 - dot(N, V), .5);
finalColor.rgb = mix(finalColor.rgb, env.rgb, fresnel);
    gl_FragColor = finalColor;
}