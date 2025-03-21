/*
contributors: Patricio Gonzalez Vivo
description: Convert from gamma to linear color space.
use: gamma2linear(<float|vec3|vec4> color)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#if !defined(GAMMA) && !defined(TARGET_MOBILE) && !defined(PLATFORM_RPI) && !defined(PLATFORM_WEBGL)
#define GAMMA 2.2
#endif
#ifndef FNC_GAMMA2LINEAR
#define FNC_GAMMA2LINEAR
float gamma2linear(const in float v) {
#ifdef GAMMA
    return pow(v, GAMMA);
#else
    // assume gamma 2.0
    return v * v;
#endif
}
vec3 gamma2linear(const in vec3 v) {
#ifdef GAMMA
    return pow(v, vec3(GAMMA));
#else
    // assume gamma 2.0
    return v * v;
#endif
}
vec4 gamma2linear(const in vec4 v) {
    return vec4(gamma2linear(v.rgb), v.a);
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: It defines the default sampler type and function for the shader based on the version of GLSL.
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef SAMPLER_FNC
#if __VERSION__ >= 300
#define SAMPLER_FNC(TEX, UV) texture(TEX, UV)
#else
#define SAMPLER_FNC(TEX, UV) texture2D(TEX, UV)
#endif
#endif
#ifndef SAMPLER_TYPE
#define SAMPLER_TYPE sampler2D
#endif
/*
contributors: Patricio Gonzalez Vivo
description: Get material BaseColor from GlslViewer's defines https://github.com/patriciogonzalezvivo/glslViewer/wiki/GlslViewer-DEFINES#material-defines
use: vec4 materialAlbedo()
options:
    - SAMPLER_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_MATERIAL_ALBEDO
#define FNC_MATERIAL_ALBEDO
#ifdef MATERIAL_BASECOLORMAP
uniform SAMPLER_TYPE MATERIAL_BASECOLORMAP;
#endif
#ifdef MATERIAL_ALBEDOMAP
uniform SAMPLER_TYPE MATERIAL_ALBEDOMAP;
#endif
vec4 materialAlbedo() {
    vec4 albedo = vec4(0.5, 0.5, 0.5, 1.0);
#if defined(MATERIAL_BASECOLORMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    #if defined(MATERIAL_BASECOLORMAP_OFFSET)
    uv += (MATERIAL_BASECOLORMAP_OFFSET).xy;
    #endif
    #if defined(MATERIAL_BASECOLORMAP_SCALE)
    uv *= (MATERIAL_BASECOLORMAP_SCALE).xy;
    #endif
    albedo = gamma2linear( SAMPLER_FNC(MATERIAL_BASECOLORMAP, uv) );
#elif defined(MATERIAL_ALBEDOMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    #if defined(MATERIAL_ALBEDOMAP_OFFSET)
    uv += (MATERIAL_ALBEDOMAP_OFFSET).xy;
    #endif
    #if defined(MATERIAL_ALBEDOMAP_SCALE)
    uv *= (MATERIAL_ALBEDOMAP_SCALE).xy;
    #endif
    albedo = gamma2linear( SAMPLER_FNC(MATERIAL_ALBEDOMAP, uv) );
#elif defined(MATERIAL_BASECOLOR)
    albedo = MATERIAL_BASECOLOR;
#elif defined(MATERIAL_ALBEDO)
    albedo = MATERIAL_ALBEDO;
#endif
#if defined(MODEL_VERTEX_COLOR)
    albedo *= v_color;
#endif
    return albedo;
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: Get material specular property from GlslViewer's defines https://github.com/patriciogonzalezvivo/glslViewer/wiki/GlslViewer-DEFINES#material-defines
use: vec4 materialMetallic()
options:
    - SAMPLER_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
    - MATERIAL_SPECULARMAP
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_MATERIAL_SPECULAR
#define FNC_MATERIAL_SPECULAR
#ifdef MATERIAL_SPECULARMAP
uniform SAMPLER_TYPE MATERIAL_SPECULARMAP;
#endif
vec3 materialSpecular() {
    vec3 spec = vec3(0.04);
#if defined(MATERIAL_SPECULARMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    #if defined(MATERIAL_SPECULARMAP_OFFSET)
    uv += (MATERIAL_SPECULARMAP_OFFSET).xy;
    #endif
    #if defined(MATERIAL_SPECULARMAP_SCALE)
    uv *= (MATERIAL_SPECULARMAP_SCALE).xy;
    #endif
    spec = SAMPLER_FNC(MATERIAL_SPECULARMAP, uv).rgb;
#elif defined(MATERIAL_SPECULAR)
    spec = MATERIAL_SPECULAR;
#endif
    return spec;
}
#endif


/*
contributors: Patricio Gonzalez Vivo
description: Get material emissive property from GlslViewer's defines https://github.com/patriciogonzalezvivo/glslViewer/wiki/GlslViewer-DEFINES#material-defines
use: vec4 materialEmissive()
options:
    - SAMPLER_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_MATERIAL_EMISSIVE
#define FNC_MATERIAL_EMISSIVE
#ifdef MATERIAL_EMISSIVEMAP
uniform SAMPLER_TYPE MATERIAL_EMISSIVEMAP;
#endif
vec3 materialEmissive() {
    vec3 emission = vec3(0.0);
#if defined(MATERIAL_EMISSIVEMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    #if defined(MATERIAL_EMISSIVEMAP_OFFSET)
    uv += (MATERIAL_EMISSIVEMAP_OFFSET).xy;
    #endif
    #if defined(MATERIAL_EMISSIVEMAP_SCALE)
    uv *= (MATERIAL_EMISSIVEMAP_SCALE).xy;
    #endif
    emission = gamma2linear( SAMPLER_FNC(MATERIAL_EMISSIVEMAP, uv) ).rgb;
#elif defined(MATERIAL_EMISSIVE)
    emission = MATERIAL_EMISSIVE;
#endif
    return emission;
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: Get material normal property from GlslViewer's defines https://github.com/patriciogonzalezvivo/glslViewer/wiki/GlslViewer-DEFINES#material-defines
use: vec4 materialOcclusion()
options:
    - SAMPLER_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_MATERIAL_OCCLUSION
#define FNC_MATERIAL_OCCLUSION
#ifdef MATERIAL_OCCLUSIONMAP
uniform SAMPLER_TYPE MATERIAL_OCCLUSIONMAP;
#endif
#if defined(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP) && !defined(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP_UNIFORM)
#define MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP_UNIFORM
uniform SAMPLER_TYPE MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP;
#endif
float materialOcclusion() {
    float occlusion = 1.0;
#if defined(MATERIAL_OCCLUSIONMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    occlusion = SAMPLER_FNC(MATERIAL_OCCLUSIONMAP, uv).r;
#elif defined(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    occlusion = SAMPLER_FNC(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP, uv).r;
#endif
#if defined(MATERIAL_OCCLUSIONMAP_STRENGTH)
    occlusion *= MATERIAL_OCCLUSIONMAP_STRENGTH;
#endif
    return occlusion;
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: Get material normal property from GlslViewer's defines https://github.com/patriciogonzalezvivo/glslViewer/wiki/GlslViewer-DEFINES#material-defines
use: vec4 materialNormal()
options:
    - SAMPLER_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_MATERIAL_NORMAL
#define FNC_MATERIAL_NORMAL
#ifdef MATERIAL_NORMALMAP
uniform SAMPLER_TYPE MATERIAL_NORMALMAP;
#endif
#ifdef MATERIAL_BUMPMAP_NORMALMAP
uniform SAMPLER_TYPE MATERIAL_BUMPMAP_NORMALMAP;
#endif
vec3 materialNormal() {
    vec3 normal = vec3(0.0, 0.0, 1.0);
#ifdef MODEL_VERTEX_NORMAL
    normal = v_normal;
    #if defined(MODEL_VERTEX_TANGENT) && defined(MODEL_VERTEX_TEXCOORD) && defined(MATERIAL_NORMALMAP) 
    vec2 uv = v_texcoord.xy;
        #if defined(MATERIAL_NORMALMAP_OFFSET)
    uv += (MATERIAL_NORMALMAP_OFFSET).xy;
        #endif
        #if defined(MATERIAL_NORMALMAP_SCALE)
    uv *= (MATERIAL_NORMALMAP_SCALE).xy;
        #endif
    normal = SAMPLER_FNC(MATERIAL_NORMALMAP, uv).xyz;
    normal = v_tangentToWorld * (normal * 2.0 - 1.0);
    #elif defined(MODEL_VERTEX_TANGENT) && defined(MODEL_VERTEX_TEXCOORD) && defined(MATERIAL_BUMPMAP_NORMALMAP)
    vec2 uv = v_texcoord.xy;
        #if defined(MATERIAL_BUMPMAP_OFFSET)
    uv += (MATERIAL_BUMPMAP_OFFSET).xy;
        #endif
        #if defined(MATERIAL_BUMPMAP_SCALE)
    uv *= (MATERIAL_BUMPMAP_SCALE).xy;
        #endif
    normal = v_tangentToWorld * ( SAMPLER_FNC(MATERIAL_BUMPMAP_NORMALMAP, uv).xyz * 2.0 - 1.0) ;
    #endif
#endif
    return normal;
}
#endif
/*
contributors: Patricio Gonzalez Vivo
description: clamp a value between 0 and 1
use: <float|vec2|vec3|vec4> saturation(<float|vec2|vec3|vec4> value)
examples:
    - https://raw.githubusercontent.com/patriciogonzalezvivo/lygia_examples/main/math_functions.frag
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#if !defined(FNC_SATURATE) && !defined(saturate)
#define FNC_SATURATE
#define saturate(V) clamp(V, 0.0, 1.0)
#endif
/*
contributors: Patricio Gonzalez Vivo
description: Convert diffuse/specular/glossiness workflow to PBR metallic factor
use: <float> toMetallic(<vec3> diffuse, <vec3> specular, <float> maxSpecular)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef TOMETALLIC_MIN_REFLECTANCE
#define TOMETALLIC_MIN_REFLECTANCE 0.04
#endif
#ifndef FNC_TOMETALLIC
#define FNC_TOMETALLIC
float toMetallic(const in vec3 diffuse, const in vec3 specular, const in float maxSpecular) {
    float perceivedDiffuse = sqrt(0.299 * diffuse.r * diffuse.r + 0.587 * diffuse.g * diffuse.g + 0.114 * diffuse.b * diffuse.b);
    float perceivedSpecular = sqrt(0.299 * specular.r * specular.r + 0.587 * specular.g * specular.g + 0.114 * specular.b * specular.b);
    if (perceivedSpecular < TOMETALLIC_MIN_REFLECTANCE) {
        return 0.0;
    }
    float a = TOMETALLIC_MIN_REFLECTANCE;
    float b = perceivedDiffuse * (1.0 - maxSpecular) / (1.0 - TOMETALLIC_MIN_REFLECTANCE) + perceivedSpecular - 2.0 * TOMETALLIC_MIN_REFLECTANCE;
    float c = TOMETALLIC_MIN_REFLECTANCE - perceivedSpecular;
    float D = max(b * b - 4.0 * a * c, 0.0);
    return saturate((-b + sqrt(D)) / (2.0 * a));
}
float toMetallic(const in vec3 diffuse, const in vec3 specular) {
    float maxSpecula = max(max(specular.r, specular.g), specular.b);
    return toMetallic(diffuse, specular, maxSpecula);
}
#endif



/*
contributors: Patricio Gonzalez Vivo
description: Get material metallic property from GlslViewer's defines https://github.com/patriciogonzalezvivo/glslViewer/wiki/GlslViewer-DEFINES#material-defines
use: vec4 materialMetallic()
options:
    - SAMPLER_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_MATERIAL_METALLIC
#define FNC_MATERIAL_METALLIC
#ifdef MATERIAL_METALLICMAP
uniform SAMPLER_TYPE MATERIAL_METALLICMAP;
#endif
#if defined(MATERIAL_ROUGHNESSMETALLICMAP) && !defined(MATERIAL_ROUGHNESSMETALLICMAP_UNIFORM)
#define MATERIAL_ROUGHNESSMETALLICMAP_UNIFORM
uniform SAMPLER_TYPE MATERIAL_ROUGHNESSMETALLICMAP;
#endif
#if defined(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP) && !defined(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP_UNIFORM)
#define MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP_UNIFORM
uniform SAMPLER_TYPE MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP;
#endif
float materialMetallic() {
    float metallic = 0.0;
#if defined(MATERIAL_METALLICMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    #if defined(MATERIAL_METALLICMAP_OFFSET)
    uv += (MATERIAL_METALLICMAP_OFFSET).xy;
    #endif
    #if defined(MATERIAL_METALLICMAP_SCALE)
    uv *= (MATERIAL_METALLICMAP_SCALE).xy;
    #endif
    metallic = SAMPLER_FNC(MATERIAL_METALLICMAP, uv).b;
#elif defined(MATERIAL_ROUGHNESSMETALLICMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    metallic = SAMPLER_FNC(MATERIAL_ROUGHNESSMETALLICMAP, uv).b;
#elif defined(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    metallic = SAMPLER_FNC(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP, uv).b;
#elif defined(MATERIAL_METALLIC)
    metallic = MATERIAL_METALLIC;
#else
    vec3 diffuse = materialAlbedo().rgb;
    vec3 specular = materialSpecular();
    metallic = toMetallic(diffuse, specular);
#endif
    return metallic;
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: Get material roughness property from GlslViewer's defines https://github.com/patriciogonzalezvivo/glslViewer/wiki/GlslViewer-DEFINES#material-defines
use: vec4 materialRoughness()
options:
    - SAMPLER_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_MATERIAL_ROUGHNESS
#define FNC_MATERIAL_ROUGHNESS
#ifdef MATERIAL_ROUGHNESSMAP
uniform SAMPLER_TYPE MATERIAL_ROUGHNESSMAP;
#endif
#if defined(MATERIAL_ROUGHNESSMETALLICMAP) && !defined(MATERIAL_ROUGHNESSMETALLICMAP_UNIFORM)
#define MATERIAL_ROUGHNESSMETALLICMAP_UNIFORM
uniform SAMPLER_TYPE MATERIAL_ROUGHNESSMETALLICMAP;
#endif
#if defined(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP) && !defined(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP_UNIFORM)
#define MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP_UNIFORM
uniform SAMPLER_TYPE MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP;
#endif
float materialRoughness() {
    float roughness = 0.05;
#if defined(MATERIAL_ROUGHNESSMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    #if defined(MATERIAL_ROUGHNESSMAP_OFFSET)
    uv += (MATERIAL_ROUGHNESSMAP_OFFSET).xy;
    #endif
    #if defined(MATERIAL_ROUGHNESSMAP_SCALE)
    uv *= (MATERIAL_ROUGHNESSMAP_SCALE).xy;
    #endif
    roughness = max(roughness, SAMPLER_FNC(MATERIAL_ROUGHNESSMAP, uv).g);
#elif defined(MATERIAL_ROUGHNESSMETALLICMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    roughness = max(roughness, SAMPLER_FNC(MATERIAL_ROUGHNESSMETALLICMAP, uv).g);
#elif defined(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP) && defined(MODEL_VERTEX_TEXCOORD)
    vec2 uv = v_texcoord.xy;
    roughness = max(roughness, SAMPLER_FNC(MATERIAL_OCCLUSIONROUGHNESSMETALLICMAP, uv).g);
#elif defined(MATERIAL_ROUGHNESS)
    roughness = MATERIAL_ROUGHNESS;
#endif
    return roughness;
}
#endif
/*
contributors: Patricio Gonzalez Vivo
description: Convertes from PBR roughness/metallic to a shininess factor (typaclly use on diffuse/specular/ambient workflow)
use: float toShininess(<float> roughness, <float> metallic)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_TOSHININESS
#define FNC_TOSHININESS
float toShininess(const in float roughness, const in float metallic) {
    float s = .95 - roughness * 0.5;
    s *= s;
    s *= s;
    return s * (80. + 160. * (1.0-metallic));
}
#endif
/*
contributors: Patricio Gonzalez Vivo
description: Get material shininess property from GlslViewer's defines https://github.com/patriciogonzalezvivo/glslViewer/wiki/GlslViewer-DEFINES#material-defines
use: vec4 materialShininess()
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_MATERIAL_SHININESS
#define FNC_MATERIAL_SHININESS
float materialShininess() {
    float shininess = 15.0;
#ifdef MATERIAL_SHININESS
    shininess = MATERIAL_SHININESS;
#elif defined(FNC_MATERIAL_METALLIC) && defined(MATERIAL_METALLIC) && defined(FNC_MATERIAL_ROUGHNESS) && defined(MATERIAL_ROUGHNESS)
    float roughness = materialRoughness();
    float metallic = materialMetallic();
    shininess = toShininess(roughness, metallic);
#endif
    return shininess;
}
#endif








/*
contributors: Patricio Gonzalez Vivo
description: Generic Material Structure
options:
    - SCENE_BACK_SURFACE
    - SHADING_MODEL_CLEAR_COAT
    - MATERIAL_HAS_CLEAR_COAT_NORMAL
    - SHADING_MODEL_IRIDESCENCE
    - SHADING_MODEL_SUBSURFACE
    - SHADING_MODEL_CLOTH
    - SHADING_MODEL_SPECULAR_GLOSSINESS
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#if !defined(MATERIAL_OPT_IN)
#define RENDER_RAYMARCHING
#define SHADING_MODEL_CLEAR_COAT
#endif
#ifndef STR_MATERIAL
#define STR_MATERIAL
struct Material {
    vec4    albedo;
    vec3    emissive;
    vec3    position;       // world position of the surface
    vec3    normal;         // world normal of the surface
#if defined(RENDER_RAYMARCHING)
    float   sdf;
    bool    valid;
#endif
    #if defined(SCENE_BACK_SURFACE)
    vec3    normal_back;    // world normal of the back surface of the model
    #endif
    vec3    ior;            // Index of Refraction
    float   roughness;
    float   metallic;
    float   reflectance;
    float   ambientOcclusion;   // default 1.0
#if defined(SHADING_MODEL_CLEAR_COAT)
    float   clearCoat;
    float   clearCoatRoughness;
    #if defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
    vec3    clearCoatNormal;    // default vec3(0.0, 0.0, 1.0);
    #endif
#endif
#if defined(SHADING_MODEL_IRIDESCENCE)
    float   thickness; // default to 300.0
#endif
#if defined(SHADING_MODEL_SUBSURFACE)
    vec3    subsurfaceColor;    // default vec3(1.0)
    float   subsurfacePower;    // default to 12.234
    float   subsurfaceThickness;// default to 1.0
#endif
};
#endif

/*
contributors: Patricio Gonzalez Vivo
description: Refractive index of different materials based on https://en.wikipedia.org/wiki/Refractive_index
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef IOR_AIR
#define IOR_AIR 1.000293
#endif
#ifndef IOR_ICE
#define IOR_ICE 1.31
#endif
#ifndef IOR_WATER
#define IOR_WATER 1.333
#endif
#ifndef IOR_WATER_RGB
#define IOR_WATER_RGB vec3(1.337, 1.333, 1.331)
#endif
#ifndef IOR_GLYCERING
#define IOR_GLYCERING 1.473
#endif
#ifndef IOR_OIL
#define IOR_OIL 1.515
#endif
#ifndef IOR_OIL_RGB
#define IOR_OIL_RGB vec3(1.530, 1.520, 1.516)
#endif
#ifndef IOR_GLASS
#define IOR_GLASS 1.5168
#endif
#ifndef IOR_GLASS_RGB
#define IOR_GLASS_RGB vec3(1.524, 1.517, 1.515)
#endif
#ifndef IOR_GLASS_FLINT 
#define IOR_GLASS_FLINT 1.69
#endif
#ifndef IOR_GLASS_FLINT_RGB 
#define IOR_GLASS_FLINT_RGB vec3(1.639, 1.627, 1.622)
#endif
#ifndef IOR_SAPPHIRE
#define IOR_SAPPHIRE 1.77
#endif
#ifndef IOR_DIAMONG
#define IOR_DIAMONG 2.42
#endif

/*
contributors: Patricio Gonzalez Vivo
description: |
    Material Constructor. Designed to integrate with GlslViewer's defines https://github.com/patriciogonzalezvivo/glslViewer/wiki/GlslViewer-DEFINES#material-defines
use:
    - void materialNew(out <material> _mat)
    - <material> materialNew()
options:
    - SURFACE_POSITION
    - SCENE_BACK_SURFACE
    - SHADING_MODEL_CLEAR_COAT
    - MATERIAL_HAS_CLEAR_COAT_NORMAL
    - SHADING_MODEL_IRIDESCENCE
    - SHADING_MODEL_SUBSURFACE
    - SHADING_MODEL_CLOTH
    - SHADING_MODEL_SPECULAR_GLOSSINESS
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef SURFACE_POSITION
#define SURFACE_POSITION vec3(0.0, 0.0, 0.0)
#endif
#ifndef RAYMARCH_MAX_DIST
#define RAYMARCH_MAX_DIST 20.0
#endif
#ifndef FNC_MATERIAL_NEW
#define FNC_MATERIAL_NEW
void materialNew(out Material _mat) {
    // Surface data
    _mat.position           = (SURFACE_POSITION).xyz;
    _mat.normal             = materialNormal();
#if defined(RENDER_RAYMARCHING)
    _mat.sdf                = RAYMARCH_MAX_DIST;
    _mat.valid              = true;
#endif
    #if defined(SCENE_BACK_SURFACE) && defined(RESOLUTION)
        vec4 back_surface       = SAMPLER_FNC(SCENE_BACK_SURFACE, gl_FragCoord.xy / RESOLUTION);
        _mat.normal_back        = back_surface.xyz;
    #else
        #if defined(SCENE_BACK_SURFACE)
        // Naive assumption of the back surface
        _mat.normal_back        = -_mat.normal;
        #endif
    #endif
    // PBR Properties
    _mat.albedo             = materialAlbedo();
    _mat.emissive           = materialEmissive();
    _mat.roughness          = materialRoughness();
    _mat.metallic           = materialMetallic();
    _mat.reflectance        = 0.5;
    _mat.ior                = vec3(IOR_GLASS_RGB);      // Index of Refraction
    _mat.ambientOcclusion   = materialOcclusion();
#if defined (SHADING_MODEL_CLEAR_COAT)
    _mat.clearCoat          = 0.0;
    _mat.clearCoatRoughness = 0.01;
    #if defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
    _mat.clearCoatNormal    = vec3(0.0, 0.0, 1.0);
    #endif
#endif
#if defined(SHADING_MODEL_IRIDESCENCE)
    _mat.thickness          = 300.0;
#endif
#if defined(SHADING_MODEL_SUBSURFACE)
    _mat.subsurfaceColor    = _mat.albedo.rgb;
    _mat.subsurfacePower    = 12.234;
    _mat.subsurfaceThickness = 20.0;
    // Simulate Absorption Using Depth Map (shadowmap)
    // https://developer.nvidia.com/gpugems/gpugems/part-iii-materials/chapter-16-real-time-approximations-subsurface-scattering
    #if defined(LIGHT_SHADOWMAP) && defined(LIGHT_COORD)
    {
        vec3 shadowCoord = LIGHT_COORD.xyz / LIGHT_COORD.w;
        float Di = SAMPLER_FNC(LIGHT_SHADOWMAP, LIGHT_COORD.xy).r;
        float Do = LIGHT_COORD.z;
        float delta = Do - Di;
        #if defined(LIGHT_SHADOWMAP_SIZE) && !defined(PLATFORM_RPI)
        vec2 shadowmap_pixel = 1.0/vec2(LIGHT_SHADOWMAP_SIZE);
        shadowmap_pixel *= pow(delta, 0.6) * 20.0;
        Di = 0.0;
        for (float x= -2.0; x <= 2.0; x++)
            for (float y= -2.0; y <= 2.0; y++) 
                Di += SAMPLER_FNC(LIGHT_SHADOWMAP, LIGHT_COORD.xy + vec2(x,y) * shadowmap_pixel).r;
        Di *= 0.04; // 1.0/25.0
        delta = Do - Di;
        #endif
        // This is pretty much of a hack by overwriting the absorption to the thinkness
        _mat.subsurfaceThickness = max(Do - Di, 0.005) * 30.0;
    }
    #endif
#endif
}
Material materialNew() {
    Material mat;
    materialNew(mat);
    return mat;
}
Material materialNew(vec3 albedo, float sdf) {
    Material mat = materialNew();
    mat.albedo.rgb = albedo;
    mat.sdf = sdf;
    return mat;
}
Material materialNew(vec3 albedo, float roughness, float metallic, float sdf) {
    Material mat = materialNew();
    mat.albedo.rgb = albedo;
    mat.metallic = metallic;
    mat.roughness = roughness;
    mat.sdf = sdf;
    return mat;
}
#endif
