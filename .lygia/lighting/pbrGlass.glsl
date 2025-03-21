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
contributors: Narkowicz 2015
description: ACES Filmic Tone Mapping Curve. https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
use: <vec3|vec4> tonemapACES(<vec3|vec4> x)
*/
#ifndef FNC_TONEMAPACES
#define FNC_TONEMAPACES
vec3 tonemapACES(vec3 v) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return saturate((v*(a*v+b))/(v*(c*v+d)+e));
}
vec4 tonemapACES(in vec4 v) {
    return vec4(tonemapACES(v.rgb), v.a);
}
#endif
/*
contributors: nan
description: |
    Converts the input HDR RGB color into one of 16 debug colors that represent
    the pixel's exposure. When the output is cyan, the input color represents
    middle gray (18% exposure). Every exposure stop above or below middle gray
    causes a color shift.
    The relationship between exposures and colors is:
    -5EV  - black
    -4EV  - darkest blue
    -3EV  - darker blue
    -2EV  - dark blue
    -1EV  - blue
     OEV  - cyan
    +1EV  - dark green
    +2EV  - green
    +3EV  - yellow
    +4EV  - yellow-orange
    +5EV  - orange
    +6EV  - bright red
    +7EV  - red
    +8EV  - magenta
    +9EV  - purple
    +10EV - white
use: <vec3|vec4> tonemapDebug(<vec3|vec4> x)
*/
#ifndef FNC_TONEMAPDEBUG
#define FNC_TONEMAPDEBUG
#if !defined(PLATFORM_RPI) && !defined(PLATFORM_WEBGL)
vec3 tonemapDebug(const vec3 x) {
    // 16 debug colors + 1 duplicated at the end for easy indexing
    vec3 debugColors[17];
    debugColors[0] = vec3(0.0, 0.0, 0.0);         // black
    debugColors[1] = vec3(0.0, 0.0, 0.1647);      // darkest blue
    debugColors[2] = vec3(0.0, 0.0, 0.3647);      // darker blue
    debugColors[3] = vec3(0.0, 0.0, 0.6647);      // dark blue
    debugColors[4] = vec3(0.0, 0.0, 0.9647);      // blue
    debugColors[5] = vec3(0.0, 0.9255, 0.9255);   // cyan
    debugColors[6] = vec3(0.0, 0.5647, 0.0);      // dark green
    debugColors[7] = vec3(0.0, 0.7843, 0.0);      // green
    debugColors[8] = vec3(1.0, 1.0, 0.0);         // yellow
    debugColors[9] = vec3(0.90588, 0.75294, 0.0); // yellow-orange
    debugColors[10] = vec3(1.0, 0.5647, 0.0);      // orange
    debugColors[11] = vec3(1.0, 0.0, 0.0);         // bright red
    debugColors[12] = vec3(0.8392, 0.0, 0.0);      // red
    debugColors[13] = vec3(1.0, 0.0, 1.0);         // magenta
    debugColors[14] = vec3(0.6, 0.3333, 0.7882);   // purple
    debugColors[15] = vec3(1.0, 1.0, 1.0);         // white
    debugColors[16] = vec3(1.0, 1.0, 1.0);         // white
    // The 5th color in the array (cyan) represents middle gray (18%)
    // Every stop above or below middle gray causes a color shift
    float l = dot(x, vec3(0.21250175, 0.71537574, 0.07212251));
    float v = log2(l / 0.18);
    v = clamp(v + 5.0, 0.0, 15.0);
    int index = int(v);
    return mix(debugColors[index], debugColors[index + 1], v - float(index));
}
vec4 tonemapDebug(const vec4 x) { return vec4(tonemapDebug(x.rgb), x.a); }
#endif
#endif
/*
contributors: [Jim Hejl, Richard Burgess-Dawson ]
description: Haarm-Peter Duikers curve from John Hables presentation "Uncharted 2 HDR Lighting", Page 140, http://www.gdcvault.com/play/1012459/Uncharted_2__HDR_Lighting
use: <vec3|vec4> tonemapFilmic(<vec3|vec4> x)
*/
#ifndef FNC_TONEMAPFILMIC
#define FNC_TONEMAPFILMIC
vec3 tonemapFilmic(vec3 v) {
    v = max(vec3(0.0), v - 0.004);
    v = (v * (6.2 * v + 0.5)) / (v * (6.2 * v + 1.7) + 0.06);
    return v;
}
vec4 tonemapFilmic(const vec4 x) { return vec4( tonemapFilmic(x.rgb), x.a ); }
#endif
/*
contributors: nan
description: Linear tonemap (no modifications are applied)
use: <vec3|vec4> tonemapLinear(<vec3|vec4> x)
*/
#ifndef FNC_TONEMAPLINEAR
#define FNC_TONEMAPLINEAR
vec3 tonemapLinear(const vec3 v) { return v; }
vec4 tonemapLinear(const vec4 v) { return v; }
#endif
/*
contributors: [Erik Reinhard, Michael Stark, Peter Shirley, James Ferwerda]
description: Photographic Tone Reproduction for Digital Images. http://www.cmap.polytechnique.fr/~peyre/cours/x2005signal/hdr_photographic.pdf
use: <vec3|vec4> tonemapReinhard(<vec3|vec4> x)
*/
#ifndef FNC_TONEMAPREINHARD
#define FNC_TONEMAPREINHARD
vec3 tonemapReinhard(const vec3 v) { return v / (1.0 + dot(v, vec3(0.21250175, 0.71537574, 0.07212251))); }
vec4 tonemapReinhard(const vec4 v) { return vec4( tonemapReinhard(v.rgb), v.a ); }
#endif
/*
contributors: [Erik Reinhard, Michael Stark, Peter Shirley, James Ferwerda]
description: Photographic Tone Reproduction for Digital Images. http://www.cmap.polytechnique.fr/~peyre/cours/x2005signal/hdr_photographic.pdf
use: <vec3|vec4> tonemapReinhardJodie(<vec3|vec4> x)
*/
#ifndef FNC_TONEMAPREINHARDJODIE
#define FNC_TONEMAPREINHARDJODIE
vec3 tonemapReinhardJodie(const vec3 x) { 
    float l = dot(x, vec3(0.21250175, 0.71537574, 0.07212251));
    vec3 tc = x / (x + 1.0);
    return mix(x / (l + 1.0), tc, tc); 
}
vec4 tonemapReinhardJodie(const vec4 x) { return vec4( tonemapReinhardJodie(x.rgb), x.a ); }
#endif
/*
contributors: nan
description: Uncharted 2 tonemapping operator
use: <vec3|vec4> tonemapUncharted(<vec3|vec4> x)
*/
#ifndef FNC_TONEMAPUNCHARTED
#define FNC_TONEMAPUNCHARTED
vec3 uncharted2Tonemap(const vec3 x) {
    const float A = 0.15;
    const float B = 0.50;
    const float C = 0.10;
    const float D = 0.20;
    const float E = 0.02;
    const float F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}
vec3 tonemapUncharted(const vec3 x) {
    const float W = 11.2;
    const float exposureBias = 2.0;
    vec3 curr = uncharted2Tonemap(exposureBias * x);
    vec3 whiteScale = 1.0 / uncharted2Tonemap(vec3(W));
    return curr * whiteScale;
}
vec4 tonemapUncharted(const vec4 x) { return vec4( tonemapUncharted(x.rgb), x.a); }
#endif
/*
author: John Hable
description: Tonemapping function from presentation, uncharted 2 HDR Lighting, Page 142 to 143
use: <vec3|vec4> tonemapUncharted2(<vec3|vec4> x)
*/
#ifndef FNC_TONEMAPUNCHARTED2
#define FNC_TONEMAPUNCHARTED2
vec3 tonemapUncharted2(vec3 v) {
    float A = 0.15; // 0.22
    float B = 0.50; // 0.30
    float C = 0.10;
    float D = 0.20;
    float E = 0.02; // 0.01
    float F = 0.30;
    float W = 11.2;
    vec4 x = vec4(v, W);
    x = ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
    return x.xyz / x.w;
}
vec4 tonemapUncharted2(const vec4 x) { return vec4( tonemapUncharted2(x.rgb), x.a); }
#endif
/*
contributors: Unreal Engine 4.0
description:  Adapted to be close to TonemapACES, with similar range. Gamma 2.2 correction is baked in, don't use with sRGB conversion! https://docs.unrealengine.com/4.26/en-US/RenderingAndGraphics/PostProcessEffects/ColorGrading/
use: <vec3|vec4> tonemapUnreal(<vec3|vec4> x)
*/
#ifndef FNC_TONEMAPUNREAL
#define FNC_TONEMAPUNREAL
vec3 tonemapUnreal(const vec3 x) { return x / (x + 0.155) * 1.019; }
vec4 tonemapUnreal(const vec4 x) { return vec4(tonemapUnreal(x.rgb), x.a); }
#endif
/*
contributors: Patricio Gonzalez Vivo
description: Tone maps the specified RGB color (meaning convert from HDR to LDR) inside the range [0..~8] to [0..1]. The input must be in linear HDR pre-exposed.
use: tonemap(<vec3|vec4> rgb)
options:
    - TONEMAP_FNC: |
        tonemapLinear, tonemapReinhard, tonemapUnreal, tonemapACES, tonemapDebug,
        tonemapUncharter
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef TONEMAP_FNC
#if defined(TARGET_MOBILE) || defined(PLATFORM_RPI)
    #define TONEMAP_FNC     tonemapUnreal
#else
    // #define TONEMAP_FNC     tonemapDebug
    // #define TONEMAP_FNC     tonemapFilmic
    // #define TONEMAP_FNC     tonemapACES
    // #define TONEMAP_FNC     tonemapUncharted2
    // #define TONEMAP_FNC     tonemapUncharted
    #define TONEMAP_FNC     tonemapReinhardJodie
    // #define TONEMAP_FNC     tonemapReinhard
    // #define TONEMAP_FNC     tonemapUnreal
    // #define TONEMAP_FNC     tonemapLinear
#endif
#endif
#ifndef FNC_TONEMAP
#define FNC_TONEMAP
vec3 tonemap(const vec3 v) { return TONEMAP_FNC(v); }
vec4 tonemap(const vec4 v) { return TONEMAP_FNC(v); }
#endif
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
description: Directional Light Structure
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef STR_LIGHT_DIRECTIONAL
#define STR_LIGHT_DIRECTIONAL
struct LightDirectional {
    vec3    direction;
    vec3    color;
    float   intensity;
};
#endif

/*
contributors: Patricio Gonzalez Vivo
description: Point light structure
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef STR_LIGHT_POINT
#define STR_LIGHT_POINT
struct LightPoint {
    vec3    position;
    vec3    color;
    float   intensity;
    float   falloff;
};
#endif


/*
contributors: Patricio Gonzalez Vivo
description: sampler shadowMap 
use: 
    - sampleShadow(<SAMPLER_TYPE> shadowMap, <vec4|vec3> _coord)
    - sampleShadow(<SAMPLER_TYPE> shadowMap, <vec2> _coord , float compare)
    - sampleShadow(<SAMPLER_TYPE> shadowMap, <vec2> _shadowMapSize, <vec2> _coord , float compare)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef SAMPLERSHADOW_FNC
#define SAMPLERSHADOW_FNC(TEX, UV) SAMPLER_FNC(TEX, UV).r
#endif
#ifndef FNC_SAMPLESHADOW
#define FNC_SAMPLESHADOW
float sampleShadow(in SAMPLER_TYPE shadowMap, in vec4 _coord) {
    vec3 shadowCoord = _coord.xyz / _coord.w;
    return SAMPLERSHADOW_FNC(shadowMap, shadowCoord.xy);
}
float sampleShadow(in SAMPLER_TYPE shadowMap, in vec3 _coord) {
    return sampleShadow(shadowMap, vec4(_coord, 1.0));
}
float sampleShadow(in SAMPLER_TYPE shadowMap, in vec2 uv, in float compare) {
    return step(compare, SAMPLERSHADOW_FNC(shadowMap, uv) );
}
float sampleShadow(in SAMPLER_TYPE shadowMap, in vec2 size, in vec2 uv, in float compare) {
    return sampleShadow(shadowMap, uv, compare);
}
#endif
/*
contributors: Patricio Gonzalez Vivo
description: sample shadow map using PCF
use: <float> sampleShadowLerp(<SAMPLER_TYPE> depths, <vec2> size, <vec2> uv, <float> compare)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_SAMPLESHADOWLERP
#define FNC_SAMPLESHADOWLERP
float sampleShadowLerp(SAMPLER_TYPE depths, vec2 size, vec2 uv, float compare) {
    vec2 texelSize = vec2(1.0)/size;
    vec2 f = fract(uv*size+0.5);
    vec2 centroidUV = floor(uv*size+0.5)/size;
    float lb = sampleShadow(depths, centroidUV+texelSize*vec2(0.0, 0.0), compare);
    float lt = sampleShadow(depths, centroidUV+texelSize*vec2(0.0, 1.0), compare);
    float rb = sampleShadow(depths, centroidUV+texelSize*vec2(1.0, 0.0), compare);
    float rt = sampleShadow(depths, centroidUV+texelSize*vec2(1.0, 1.0), compare);
    float a = mix(lb, lt, f.y);
    float b = mix(rb, rt, f.y);
    float c = mix(a, b, f.x);
    return c;
}
#endif
/*
contributors: Patricio Gonzalez Vivo
description: sample shadow map using PCF
use:
    - <float> sampleShadowPCF(<SAMPLER_TYPE> depths, <vec2> size, <vec2> uv, <float> compare)
    - <float> sampleShadowPCF(<vec3> lightcoord)
options:
    - LIGHT_SHADOWMAP_BIAS
    - SAMPLESHADOWPCF_SAMPLER_FNC
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef SAMPLESHADOWPCF_SAMPLER_FNC
#define SAMPLESHADOWPCF_SAMPLER_FNC sampleShadowLerp
#endif
#ifndef FNC_SAMPLESHADOWPCF
#define FNC_SAMPLESHADOWPCF
float sampleShadowPCF(SAMPLER_TYPE depths, vec2 size, vec2 uv, float compare) {
    vec2 pixel = 1.0/size;
    float result = 0.0;
    for (float x= -2.0; x <= 2.0; x++)
        for (float y= -2.0; y <= 2.0; y++) 
            result += SAMPLESHADOWPCF_SAMPLER_FNC(depths, size, uv + vec2(x,y) * pixel, compare);
    return result/25.0;
}
#endif
/*
contributors: Patricio Gonzalez Vivo
description: Sample shadow map using PCF
use:
    - <float> sampleShadowPCF(<SAMPLER_TYPE> depths, <vec2> size, <vec2> uv, <float> compare)
    - <float> sampleShadowPCF(<vec3> lightcoord)
options:
    - SHADOWMAP_BIAS
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef SHADOWMAP_BIAS
#define SHADOWMAP_BIAS 0.005
#endif
#ifndef SHADOW_SAMPLER_FNC
#define SHADOW_SAMPLER_FNC sampleShadowPCF
#endif
#ifndef FNC_SHADOW
#define FNC_SHADOW
float shadow(SAMPLER_TYPE shadoMap, const in vec2 size, const in vec2 uv, float compare) {
    #ifdef SHADOWMAP_BIAS
    compare -= SHADOWMAP_BIAS;
    #endif
    #if defined(PLATFORM_RPI) 
    return sampleShadow(shadoMap, size, uv, compare);
    #elif defined(TARGET_MOBILE)
    return sampleShadowLerp(shadoMap, size, uv, compare);
    #else 
    return sampleShadowPCF(shadoMap, size, uv, compare);
    #endif
}
#endif 
#ifndef FNC_LIGHT_NEW
#define FNC_LIGHT_NEW
#if defined(LIGHT_DIRECTION) 
void lightNew(out LightDirectional _L) {
    #ifdef LIGHT_DIRECTION
    _L.direction    = normalize(LIGHT_DIRECTION);
    #elif defined(LIGHT_POSITION)
    _L.direction    = normalize(LIGHT_POSITION);
    #else
    _L.direction    = normalize(vec3(0.0, 1.0, -1.0));
    #endif
    #ifdef LIGHT_COLOR
    _L.color        = LIGHT_COLOR;
    #else 
    _L.color        = vec3(1.0);
    #endif
    #ifdef LIGHT_INTENSITY
    _L.intensity    = LIGHT_INTENSITY;
    #else
    _L.intensity    = 1.0;
    #endif
    #if defined(LIGHT_SHADOWMAP) && defined(LIGHT_SHADOWMAP_SIZE) && defined(LIGHT_COORD)
    _L.intensity *= shadow(LIGHT_SHADOWMAP, vec2(LIGHT_SHADOWMAP_SIZE), (LIGHT_COORD).xy, (LIGHT_COORD).z);
    #endif
}
LightDirectional LightDirectionalNew() { LightDirectional l; lightNew(l); return l; }
#endif
#if defined(LIGHT_POSITION)
void lightNew(out LightPoint _L) {
    #if defined(SURFACE_POSITION)
    _L.position     = LIGHT_POSITION - SURFACE_POSITION.xyz;
    #else
    _L.position     = LIGHT_POSITION;
    #endif
    #ifdef LIGHT_COLOR
    _L.color        = LIGHT_COLOR;
    #else 
    _L.color        = vec3(1.0);
    #endif
    #ifdef LIGHT_INTENSITY
    _L.intensity    = LIGHT_INTENSITY;
    #else
    _L.intensity    = 1.0;
    #endif
    #ifdef LIGHT_FALLOFF
    _L.falloff      = LIGHT_FALLOFF;
    #else
    _L.falloff      = 0.0;
    #endif
    #if defined(LIGHT_SHADOWMAP) && defined(LIGHT_SHADOWMAP_SIZE) && defined(LIGHT_COORD)
    _L.intensity *= shadow(LIGHT_SHADOWMAP, vec2(LIGHT_SHADOWMAP_SIZE), (LIGHT_COORD).xy, (LIGHT_COORD).z);
    #endif
}
LightPoint LightPointNew() {
    LightPoint l;
    lightNew(l);
    return l;
}
#endif
#endif
/*
contributors: Patricio Gonzalez Vivo
description: some useful math constants
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef EIGHTH_PI
#define EIGHTH_PI 0.39269908169
#endif
#ifndef QTR_PI
#define QTR_PI 0.78539816339
#endif
#ifndef HALF_PI
#define HALF_PI 1.5707963267948966192313216916398
#endif
#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif
#ifndef TWO_PI
#define TWO_PI 6.2831853071795864769252867665590
#endif
#ifndef TAU
#define TAU 6.2831853071795864769252867665590
#endif
#ifndef INV_PI
#define INV_PI 0.31830988618379067153776752674503
#endif
#ifndef INV_SQRT_TAU
#define INV_SQRT_TAU 0.39894228040143267793994605993439  // 1.0/SQRT_TAU
#endif
#ifndef SQRT_HALF_PI
#define SQRT_HALF_PI 1.25331413732
#endif
#ifndef PHI
#define PHI 1.618033988749894848204586834
#endif
#ifndef EPSILON
#define EPSILON 0.0000001
#endif
#ifndef GOLDEN_RATIO
#define GOLDEN_RATIO 1.6180339887
#endif
#ifndef GOLDEN_RATIO_CONJUGATE 
#define GOLDEN_RATIO_CONJUGATE 0.61803398875
#endif
#ifndef GOLDEN_ANGLE // (3.-sqrt(5.0))*PI radians
#define GOLDEN_ANGLE 2.39996323
#endif
#ifndef DEG2RAD
#define DEG2RAD (PI / 180.0)
#endif
#ifndef RAD2DEG
#define RAD2DEG (180.0 / PI)
#endif

/*
contributors: Patricio Gonzalez Vivo
description: 3D vector to equirect 2D projection
use: <vec2> xyz2equirect(<vec2> d)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_XYZ2EQUIRECT
#define FNC_XYZ2EQUIRECT
vec2 xyz2equirect(vec3 d) {
    return vec2(atan(d.z, d.x) + PI, acos(-d.y)) / vec2(2.0 * PI, PI);
}
#endif
/*
contributors: ["Patricio Gonzalez Vivo", "David Hoskins", "Inigo Quilez"]
description: Pass a value and get some random normalize value between 0 and 1
use: float random[2|3](<float|vec2|vec3> value)
options:
    - RANDOM_HIGHER_RANGE: for working with a range over 0 and 1
    - RANDOM_SINLESS: Use sin-less random, which tolerates bigger values before producing pattern. From https://www.shadertoy.com/view/4djSRW
    - RANDOM_SCALE: by default this scale if for number with a big range. For producing good random between 0 and 1 use bigger range
examples:
    - /shaders/generative_random.frag
license:
    - MIT License (MIT) Copyright 2014, David Hoskins
*/
#ifndef RANDOM_SCALE
#ifdef RANDOM_HIGHER_RANGE
#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)
#else
#define RANDOM_SCALE vec4(443.897, 441.423, .0973, .1099)
#endif
#endif
#ifndef FNC_RANDOM
#define FNC_RANDOM
float random(in float x) {
#ifdef RANDOM_SINLESS
    x = fract(x * RANDOM_SCALE.x);
    x *= x + 33.33;
    x *= x + x;
    return fract(x);
#else
    return fract(sin(x) * 43758.5453);
#endif
}
float random(in vec2 st) {
#ifdef RANDOM_SINLESS
    vec3 p3  = fract(vec3(st.xyx) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
#else
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
#endif
}
float random(in vec3 pos) {
#ifdef RANDOM_SINLESS
    pos  = fract(pos * RANDOM_SCALE.xyz);
    pos += dot(pos, pos.zyx + 31.32);
    return fract((pos.x + pos.y) * pos.z);
#else
    return fract(sin(dot(pos.xyz, vec3(70.9898, 78.233, 32.4355))) * 43758.5453123);
#endif
}
float random(in vec4 pos) {
#ifdef RANDOM_SINLESS
    pos = fract(pos * RANDOM_SCALE);
    pos += dot(pos, pos.wzxy + 33.33);
    return fract((pos.x + pos.y) * (pos.z + pos.w));
#else
    float dot_product = dot(pos, vec4(12.9898,78.233,45.164,94.673));
    return fract(sin(dot_product) * 43758.5453);
#endif
}
vec2 random2(float p) {
    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}
vec2 random2(vec2 p) {
    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}
vec2 random2(vec3 p3) {
    p3 = fract(p3 * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}
vec3 random3(float p) {
    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xxy + p3.yzz) * p3.zyx); 
}
vec3 random3(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yxz + 19.19);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}
vec3 random3(vec3 p) {
    p = fract(p * RANDOM_SCALE.xyz);
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yzz) * p.zyx);
}
vec4 random4(float p) {
    vec4 p4 = fract(p * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   
}
vec4 random4(vec2 p) {
    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}
vec4 random4(vec3 p) {
    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}
vec4 random4(vec4 p4) {
    p4 = fract(p4  * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}
#endif
/*
contributors: Patricio Gonzalez Vivo
description: Signed Random
use: srandomX(<vec2|vec3> x)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_SRANDOM
#define FNC_SRANDOM
float srandom(in float x) {
  return -1. + 2. * fract(sin(x) * 43758.5453);
}
float srandom(in vec2 st) {
  return -1. + 2. * fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
float srandom(in vec3 pos) {
  return -1. + 2. * fract(sin(dot(pos.xyz, vec3(70.9898, 78.233, 32.4355))) * 43758.5453123);
}
float srandom(in vec4 pos) {
    float dot_product = dot(pos, vec4(12.9898,78.233,45.164,94.673));
    return -1. + 2. * fract(sin(dot_product) * 43758.5453);
}
vec2 srandom2(in vec2 st) {
    const vec2 k = vec2(.3183099, .3678794);
    st = st * k + k.yx;
    return -1. + 2. * fract(16. * k * fract(st.x * st.y * (st.x + st.y)));
}
vec3 srandom3(in vec3 p) {
    p = vec3( dot(p, vec3(127.1, 311.7, 74.7)),
            dot(p, vec3(269.5, 183.3, 246.1)),
            dot(p, vec3(113.5, 271.9, 124.6)));
    return -1. + 2. * fract(sin(p) * 43758.5453123);
}
vec2 srandom2(in vec2 p, const in float tileLength) {
    p = mod(p, vec2(tileLength));
    return srandom2(p);
}
vec3 srandom3(in vec3 p, const in float tileLength) {
    p = mod(p, vec3(tileLength));
    return srandom3(p);
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: Convert from linear to gamma color space.
use: linear2gamma(<float|vec3|vec4> color)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#if !defined(GAMMA) && !defined(TARGET_MOBILE) && !defined(PLATFORM_RPI) && !defined(PLATFORM_WEBGL)
#define GAMMA 2.2
#endif
#ifndef FNC_LINEAR2GAMMA
#define FNC_LINEAR2GAMMA
vec3 linear2gamma(const in vec3 v) {
#ifdef GAMMA
    return pow(v, vec3(1.0/GAMMA));
#else
    // assume gamma 2.0
    return sqrt(v);
#endif
}
vec4 linear2gamma(const in vec4 v) {
    return vec4(linear2gamma(v.rgb), v.a);
}
float linear2gamma(const in float v) {
#ifdef GAMMA
    return pow(v, 1.0/GAMMA);
#else
    // assume gamma 2.0
    return sqrt(v);
#endif
}
#endif


/*
contributors: Patricio Gonzalez Vivo
description: sample an equirect texture as it was a cubemap
use: sampleEquirect(<SAMPLER_TYPE> texture, <vec3> dir)
options:
    - SAMPLER_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
    - SAMPLEEQUIRECT_ITERATIONS: null
    - SAMPLEEQUIRECT_FLIP_Y
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_SAMPLEEQUIRECT
#define FNC_SAMPLEEQUIRECT
vec4 sampleEquirect(SAMPLER_TYPE tex, vec3 dir) { 
    vec2 st = xyz2equirect(dir);
    #ifdef SAMPLEEQUIRECT_FLIP_Y
    st.y = 1.0-st.y;
    #endif
    return SAMPLER_FNC(tex, st); 
}
vec4 sampleEquirect(SAMPLER_TYPE tex, vec3 dir, float lod) { 
    #if defined(SAMPLEEQUIRECT_ITERATIONS)
    vec4 color = vec4(0.0);
    vec2 st = xyz2equirect(dir);
    #ifdef SAMPLEEQUIRECT_FLIP_Y
        st.y = 1.0-st.y;
    #endif
    vec2 r = vec2(1.0+lod);
    const float f = 1.0 / (1.001 - 0.75);
    mat2 rot = mat2( cos(GOLDEN_ANGLE), sin(GOLDEN_ANGLE), 
                    -sin(GOLDEN_ANGLE), cos(GOLDEN_ANGLE));
    vec2 st2 = vec2( dot(st + st - r, vec2(.0002,-0.001)), 0.0 );
    float counter = 0.0;
    #ifdef PLATFORM_WEBGL
    for (float i = 0.0; i < float(SAMPLEEQUIRECT_ITERATIONS); i++) {
    #else
    for (float i = 0.0; i < float(SAMPLEEQUIRECT_ITERATIONS); i += 2.0/i) {
    #endif
        st2 *= rot;
        color += gamma2linear( SAMPLER_FNC(tex, st + st2 * i / vec2(r.x * 2.0, r.y))) * f;
        counter++;
    }
    return linear2gamma(color / counter);
    #else
    dir += srandom3( dir ) * 0.01 * lod;
    vec2 st = xyz2equirect(dir);
    #ifdef SAMPLEEQUIRECT_FLIP_Y
        st.y = 1.0-st.y;
    #endif
    return SAMPLER_FNC(tex, st);
    #endif
}
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

/*
contributors:  Shadi El Hajj
description: Structure to hold shading variables
license: MIT License (MIT) Copyright (c) 2024 Shadi EL Hajj
*/
#ifndef STR_SHADING_DATA
#define STR_SHADING_DATA
struct ShadingData {
   vec3 V;
   vec3 N;
   vec3 H;
   vec3 L;
   vec3 R;
   float NoV;
   float NoL;
   float NoH;
   float roughness;
   float linearRoughness;
   vec3 diffuseColor;
   vec3 specularColor;
   vec3 energyCompensation;
   vec3 directDiffuse;
   vec3 directSpecular;
   vec3 indirectDiffuse;
   vec3 indirectSpecular;
};
#endif


/*
contributors: Patricio Gonzalez Vivo
description: |
    This function calculates the reflection vector of a given vector and normal.
    It also takes into account the roughness of the material.
    If MATERIAL_ANISOTROPY is defined, it will also take into account the anisotropy direction.
    If MODEL_VERTEX_TANGENT is defined, it will use the tangentToWorld matrix to calculate the anisotropy direction.
use: <vec3> reflection(<vec3> vector, <vec3> normal, <float> roughness);
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_REFLECTION
#define FNC_REFLECTION
vec3 reflection(const in vec3 _V, const in vec3 _N, const in float _roughness) {
        // Reflect
#ifdef MATERIAL_ANISOTROPY
    vec3  anisotropicT = MATERIAL_ANISOTROPY_DIRECTION;
    vec3  anisotropicB = MATERIAL_ANISOTROPY_DIRECTION;
    #ifdef MODEL_VERTEX_TANGENT
    anisotropicT = normalize(v_tangentToWorld * MATERIAL_ANISOTROPY_DIRECTION);
    anisotropicB = normalize(cross(v_tangentToWorld[2], anisotropicT));
    #endif
    vec3  anisotropyDirection = MATERIAL_ANISOTROPY >= 0.0 ? anisotropicB : anisotropicT;
    vec3  anisotropicTangent  = cross(anisotropyDirection, _V);
    vec3  anisotropicNormal   = cross(anisotropicTangent, anisotropyDirection);
    float bendFactor          = abs(MATERIAL_ANISOTROPY) * saturate(5.0 * _roughness);
    vec3  bentNormal          = normalize(mix(_N, anisotropicNormal, bendFactor));
    return reflect(-_V, bentNormal);
#else
    return reflect(-_V, _N);
#endif
}
#endif
/*
contributors: Shadi El Hajj
description: Compute F0 for perceptual reflectance parameter. From Sébastien Lagarde's paper "Moving Frostbite to PBR".
use: <float> reflectance2f0(<float> reflectance)
license: MIT License (MIT) Copyright (c) 2024 Shadi EL Hajj
*/
#ifndef FNC_REFLECTANCE2F0
#define FNC_REFLECTANCE2F0
float reflectance2f0(const float reflectance) { return 0.16 * reflectance * reflectance; }
#endif
/*
contributors: Shadi El Hajj
description: Classic Disney reparametrisation of roughness from Burley's paper "Physically Based Shading At Disney". Sébastien Lagarde's recommends clamping perceptual roughness to 0.045 in his paper "Moving Frostbite to PBR".
use: <float> perceptual2linearRoughness(<float> perceptualRoughness)
license: MIT License (MIT) Copyright (c) 2024 Shadi EL Hajj
*/
#ifndef MIN_PERCEPTUAL_ROUGHNESS
#define MIN_PERCEPTUAL_ROUGHNESS 0.045
#endif
#ifndef FNC_PERCEPTUAL_LINEAR_ROUGHNESS
#define FNC_PERCEPTUAL_LINEAR_ROUGHNESS
float perceptual2linearRoughness(float perceptualRoughness) {
    perceptualRoughness = clamp(perceptualRoughness, MIN_PERCEPTUAL_ROUGHNESS, 1.0);
    return perceptualRoughness * perceptualRoughness;
}
#endif
/*
contributors:  Shadi El Hajj
description: ShadingData constructor
license: MIT License (MIT) Copyright (c) 2024 Shadi EL Hajj
*/
#ifndef FNC_SHADING_DATA_NEW
#define FNC_SHADING_DATA_NEW 
ShadingData shadingDataNew() {
   ShadingData shadingData;
   shadingData.V = vec3(0.0, 0.0, 0.0);
   shadingData.N = vec3(0.0, 0.0, 0.0);
   shadingData.H = vec3(0.0, 0.0, 0.0);
   shadingData.L = vec3(0.0, 0.0, 0.0);
   shadingData.R = vec3(0.0, 0.0, 0.0);
   shadingData.NoV = 0.0;
   shadingData.NoL = 0.0;
   shadingData.NoH = 0.0;
   shadingData.roughness = 0.0;
   shadingData.linearRoughness = 0.0;
   shadingData.diffuseColor = vec3(0.0, 0.0, 0.0);
   shadingData.specularColor = vec3(0.0, 0.0, 0.0);
   shadingData.energyCompensation = vec3(1.0, 1.0, 1.0);
   shadingData.directDiffuse = vec3(0.0, 0.0, 0.0);
   shadingData.directSpecular = vec3(0.0, 0.0, 0.0);
   shadingData.indirectDiffuse = vec3(0.0, 0.0, 0.0);
   shadingData.indirectSpecular = vec3(0.0, 0.0, 0.0);
   return shadingData;
}
void shadingDataNew(Material mat, inout ShadingData shadingData) {
   float dielectricF0 = reflectance2f0(mat.reflectance);
   shadingData.N = mat.normal;
   shadingData.R = reflection(shadingData.V, shadingData.N, mat.roughness);
   shadingData.NoV = dot(shadingData.N, shadingData.V);
   shadingData.roughness = max(mat.roughness, MIN_PERCEPTUAL_ROUGHNESS);
   shadingData.linearRoughness = perceptual2linearRoughness(shadingData.roughness);
   shadingData.diffuseColor = mat.albedo.rgb * (1.0 - mat.metallic);
   shadingData.specularColor = mix(vec3(dielectricF0, dielectricF0, dielectricF0), mat.albedo.rgb, mat.metallic);
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: fast approximation to pow()
use: <float> powFast(<float> x, <float> exp)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_POWFAST
#define FNC_POWFAST
float powFast(const in float a, const in float b) { return a / ((1. - b) * a + b); }
#endif

/*
contributors: Patricio Gonzalez Vivo
description: triplanar mapping
use: <vec4> sample2DCube(in <SAMPLER_TYPE> lut, in <vec3> xyz)
options:
    - SAMPLER_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
    - SAMPLETRIPLANAR_TYPE: optional depending the target version of GLSL (vec4 or vec3)
    - SAMPLETRIPLANAR_FNC(TEX, UV): optional depending the target version of GLSL (texture2D(...) or texture(...))
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef SAMPLETRIPLANAR_TYPE
#define SAMPLETRIPLANAR_TYPE vec4
#endif
#ifndef SAMPLETRIPLANAR_FNC
#define SAMPLETRIPLANAR_FNC(TEX, UV) SAMPLER_FNC(TEX, UV)
#endif
#ifndef FNC_SAMPLETRIPLANAR
#define FNC_SAMPLETRIPLANAR
SAMPLETRIPLANAR_TYPE sampleTriplanar(SAMPLER_TYPE tex, in vec3 d) {
    SAMPLETRIPLANAR_TYPE colx = SAMPLETRIPLANAR_FNC(tex, d.yz);
    SAMPLETRIPLANAR_TYPE coly = SAMPLETRIPLANAR_FNC(tex, d.zx);
    SAMPLETRIPLANAR_TYPE colz = SAMPLETRIPLANAR_FNC(tex, d.xy);
    vec3 n = d*d;
    return (colx*n.x + coly*n.y + colz*n.z)/(n.x+n.y+n.z);
}
// iq's cubemap function
SAMPLETRIPLANAR_TYPE sampleTriplanar(SAMPLER_TYPE tex, in vec3 d, in float s) {
    SAMPLETRIPLANAR_TYPE colx = SAMPLETRIPLANAR_FNC(tex, 0.5 + s*d.yz/d.x);
    SAMPLETRIPLANAR_TYPE coly = SAMPLETRIPLANAR_FNC(tex, 0.5 + s*d.zx/d.y);
    SAMPLETRIPLANAR_TYPE colz = SAMPLETRIPLANAR_FNC(tex, 0.5 + s*d.xy/d.z);
    vec3 n = d*d;
    return (colx*n.x + coly*n.y + colz*n.z)/(n.x+n.y+n.z);
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: Creates a fake cube and returns the value giving a normal direction
use: <vec3> fakeCube(<vec3> _normal [, <float> _shininnes])
options:
    - FAKECUBE_LIGHT_AMOUNT: amount of light to fake
    - FAKECUBE_ONLYXWALL: only the x wall is lit
    - FAKECUBE_ONLYYWALL: only the y wall is lit
    - FAKECUBE_ONLYZWALL: only the z wall is lit
    - FAKECUBE_NOFLOOR: removes the floor from the fake cube
    - FAKECUBE_NOROOF: removes the floor from the fake cube
    - FAKECUBE_NOXWALL: removes the x wall from the fake cube
    - FAKECUBE_NONXWALL: removes the -x wall from the fake cube
    - FAKECUBE_NOZWALL: removes the z wall from the fake cube
    - FAKECUBE_NOMZWALL: removes the -z wall from the fake cube
    - FAKECUBE_TEXTURE2D: function to sample the fake cube
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FAKECUBE_LIGHT_AMOUNT
#define FAKECUBE_LIGHT_AMOUNT 0.005
#endif
#ifndef FNC_FAKECUBE
#define FNC_FAKECUBE
vec3 fakeCube(const in vec3 _normal, const in float _shininnes) {
    #if defined(FAKECUBE_TEXTURE2D)
    return sampleTriplanar(FAKECUBE_TEXTURE2D, _normal);
    #elif defined(FAKECUBE_ONLYXWALL)
    return vec3( powFast(saturate(_normal.x) + FAKECUBE_LIGHT_AMOUNT, _shininnes) );
    #elif defined(FAKECUBE_ONLYYWALL)
    return vec3( powFast(saturate(_normal.y) + FAKECUBE_LIGHT_AMOUNT, _shininnes) );
    #elif defined(FAKECUBE_ONLYZWALL)
    return vec3( powFast(saturate(_normal.z) + FAKECUBE_LIGHT_AMOUNT, _shininnes) );
    #else
    vec3 rAbs = abs(_normal);
    return vec3( powFast(max(max(rAbs.x, rAbs.y), rAbs.z) + FAKECUBE_LIGHT_AMOUNT, _shininnes)
        #ifdef FAKECUBE_NOFLOOR
        * smoothstep(-1.0, 0., _normal.y) 
        #endif
        #ifdef FAKECUBE_NOROOF
        * smoothstep(1.0, 0., _normal.y) 
        #endif
        #ifdef FAKECUBE_NOXWALL
        * smoothstep(1.0, 0.0, _normal.x) 
        #endif
        #ifdef FAKECUBE_NONXWALL
        * smoothstep(-1.0, 0., _normal.x) 
        #endif
        #ifdef FAKECUBE_NOZWALL
        * smoothstep(-1.0, 0., _normal.z) 
        #endif
        #ifdef FAKECUBE_NONZWALL
        * smoothstep(1.0, 0., _normal.z) 
        #endif
    );
    #endif
}
vec3 fakeCube(const in vec3 _normal) {
    return fakeCube(_normal, materialShininess() );
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: |
    Get environment map light coming from a normal direction and according
    to some roughness/metallic value. If there is no SCENE_CUBEMAP texture it creates
    a fake cube
use: <vec3> envMap(<vec3> _normal, <float> _roughness [, <float> _metallic])
options:
    - SCENE_CUBEMAP: pointing to the cubemap texture
    - ENVMAP_MAX_MIP_LEVEL
    - ENVMAP_LOD_OFFSET
    - ENVMAP_FNC(NORMAL, ROUGHNESS, METALLIC)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef SAMPLE_CUBE_FNC
#if __VERSION__ >= 300
#define SAMPLE_CUBE_FNC(CUBEMAP, NORM, LOD) textureLod(CUBEMAP, NORM, LOD)
#else
#define SAMPLE_CUBE_FNC(CUBEMAP, NORM, LOD) textureCube(CUBEMAP, NORM, LOD)
#endif
#endif
#if !defined(ENVMAP_MAX_MIP_LEVEL) && __VERSION__ < 430
#define ENVMAP_MAX_MIP_LEVEL 3.0
#endif
#ifndef ENVMAP_LOD_OFFSET
#define ENVMAP_LOD_OFFSET 0
#endif
#ifndef FNC_ENVMAP
#define FNC_ENVMAP
float envMapRoughnessToLod(float roughness, float roughnessOneLevel) {
    // quadratic fit for log2(roughness)+roughnessOneLevel
    return roughnessOneLevel * roughness * (2.0 - roughness);
}
vec3 envMap(const in vec3 _normal, const in float _roughness, const in float _metallic) {
// ENVMAP overwrites cube sampling  
#if defined(ENVMAP_FNC) 
    return ENVMAP_FNC(_normal, _roughness, _metallic);
#elif defined(SCENE_EQUIRECT)
    return sampleEquirect(SCENE_EQUIRECT, _normal, 1.0 + 26.0 * _roughness).rgb;
// Cubemap sampling
#elif defined(SCENE_CUBEMAP) && !defined(ENVMAP_MAX_MIP_LEVEL)
    int roughnessOneLevel = textureQueryLevels(SCENE_CUBEMAP) - ENVMAP_LOD_OFFSET - 1;
    return SAMPLE_CUBE_FNC( SCENE_CUBEMAP, _normal, envMapRoughnessToLod(_roughness, float(roughnessOneLevel)) ).rgb;
#elif defined(SCENE_CUBEMAP)
    return SAMPLE_CUBE_FNC( SCENE_CUBEMAP, _normal, envMapRoughnessToLod(_roughness, ENVMAP_MAX_MIP_LEVEL) ).rgb;
// Default
#else
    return fakeCube(_normal, toShininess(_roughness, _metallic));
#endif
}
vec3 envMap(const in vec3 _normal, const in float _roughness) {
    return envMap(_normal, _roughness, 1.0);
}
vec3 envMap(const in Material _M, ShadingData shadingData) {
    return envMap(shadingData.R, _M.roughness, _M.metallic);
}
#endif



#ifndef SPECULAR_POW
#if defined(TARGET_MOBILE) || defined(PLATFORM_RPI) || defined(PLATFORM_WEBGL)
#define SPECULAR_POW(A,B) powFast(A,B)
#else
#define SPECULAR_POW(A,B) pow(A,B)
#endif
#endif
#ifndef FNC_SPECULAR_PHONG
#define FNC_SPECULAR_PHONG 
// https://github.com/glslify/glsl-specular-phong
float specularPhong(const in vec3 L, const in vec3 N, const in vec3 V, const in float shininess) {
    vec3 R = reflect(L, N); // 2.0 * dot(N, L) * N - L;
    return SPECULAR_POW(max(0.0, dot(R, -V)), shininess);
}
float specularPhong(ShadingData shadingData) {
    return specularPhong(shadingData.L, shadingData.N, shadingData.V, shadingData.roughness);
}
float specularPhongRoughness(ShadingData shadingData) {
    return specularPhong(shadingData.L, shadingData.N, shadingData.V, toShininess(shadingData.roughness, 0.0));
}
#endif


#ifndef SPECULAR_POW
#if defined(TARGET_MOBILE) || defined(PLATFORM_RPI) || defined(PLATFORM_WEBGL)
#define SPECULAR_POW(A,B) powFast(A,B)
#else
#define SPECULAR_POW(A,B) pow(A,B)
#endif
#endif
#ifndef FNC_SPECULAR_BLINNPHONG
#define FNC_SPECULAR_BLINNPHONG
// https://github.com/glslify/glsl-specular-blinn-phong
float specularBlinnPhong(const in float NoH, float shininess) {
    return SPECULAR_POW(max(0.0, NoH), shininess);
}
float specularBlinnPhong(ShadingData shadingData) {
    return specularBlinnPhong(shadingData.NoH, shadingData.roughness);
}
float specularBlinnPhongRoughness(ShadingData shadingData) {
    return specularBlinnPhong(shadingData.NoH, toShininess(shadingData.roughness, 0.0));
}
#endif

/*
contributors: Patricio Gonzalez Vivo
description: clamp a value between 0 and the medium precision max (65504.0) for floating points
use: <float|vec2|vec3|vec4> saturateMediump(<float|vec2|vec3|vec4> value)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_SATURATEMEDIUMP
#define FNC_SATURATEMEDIUMP
#ifndef MEDIUMP_FLT_MAX
#define MEDIUMP_FLT_MAX    65504.0
#endif
#if defined(TARGET_MOBILE) || defined(PLATFORM_WEBGL) || defined(PLATFORM_RPI)
#define saturateMediump(V) min(V, MEDIUMP_FLT_MAX)
#else
#define saturateMediump(V) V
#endif
#endif
#ifndef FNC_GGX
#define FNC_GGX
// Walter et al. 2007, "Microfacet Models for Refraction through Rough Surfaces"
// This one is not great on mediump. Read next comment 
float GGX(const in float NoH, const in float roughness) {
    float oneMinusNoHSquared = 1.0 - NoH * NoH;
    float a = NoH * roughness;
    float k = roughness / (oneMinusNoHSquared + a * a);
    float d = k * k * INV_PI;
    return saturateMediump(d);
}
float GGX(const in vec3 N, const in vec3 H, const in float NoH, float roughness) {
#if defined(TARGET_MOBILE) || defined(PLATFORM_RPI) || defined(PLATFORM_WEBGL)
    // In mediump, there are two problems computing 1.0 - NoH^2
    // 1) 1.0 - NoH^2 suffers floating point cancellation when NoH^2 is close to 1 (highlights)
    // 2) NoH doesn't have enough precision around 1.0
    // Both problem can be fixed by computing 1-NoH^2 in highp and providing NoH in highp as well
    // However, we can do better using Lagrange's identity:
    //      ||a x b||^2 = ||a||^2 ||b||^2 - (a . b)^2
    // since N and H are unit vectors: ||N x H||^2 = 1.0 - NoH^2
    // This computes 1.0 - NoH^2 directly (which is close to zero in the highlights and has
    // enough precision).
    // Overall this yields better performance, keeping all computations in mediump
    vec3 NxH = cross(N, H);
    float oneMinusNoHSquared = dot(NxH, NxH);
#else
    float oneMinusNoHSquared = 1.0 - NoH * NoH;
#endif
    float a = NoH * roughness;
    float k = roughness / (oneMinusNoHSquared + a * a);
    float d = k * k * INV_PI;
    return saturateMediump(d);
}
vec3 importanceSamplingGGX(vec2 u, float roughness) {
    float a2 = roughness * roughness;
    float phi = 2.0 * PI * u.x;
    float cosTheta2 = (1.0 - u.y) / (1.0 + (a2 - 1.0) * u.y);
    float cosTheta = sqrt(cosTheta2);
    float sinTheta = sqrt(1.0 - cosTheta2);
    return vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
}
#endif

#ifndef FNC_SMITH_GGX_CORRELATED
#define FNC_SMITH_GGX_CORRELATED
float smithGGXCorrelated(const in float NoV, const in float NoL, const in float roughness) {
    // Heitz 2014, "Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs"
    float a2 = roughness * roughness;
    // TODO: lambdaV can be pre-computed for all the lights, it should be moved out of this function
    float lambdaV = NoL * sqrt((NoV - a2 * NoV) * NoV + a2);
    float lambdaL = NoV * sqrt((NoL - a2 * NoL) * NoL + a2);
    float v = 0.5 / (lambdaV + lambdaL);
    // a2=0 => v = 1 / 4*NoL*NoV   => min=1/4, max=+inf
    // a2=1 => v = 1 / 2*(NoL+NoV) => min=1/4, max=+inf
    // clamp to the maximum value representable in mediump
    return saturateMediump(v);
}
float smithGGXCorrelated_Fast(const in float NoV, const in float NoL, const in float roughness) {
    // Hammon 2017, "PBR Diffuse Lighting for GGX+Smith Microsurfaces"
    float v = 0.5 / mix(2.0 * NoL * NoV, NoL + NoV, roughness);
    return saturateMediump(v);
}
#endif


/*
contributors: Patricio Gonzalez Vivo
description: power of 5
use: <float|vec2|vec3|vec4> pow5(<float|vec2|vec3|vec4> v)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_POW5
#define FNC_POW5
float pow5(const in float v) {
    float v2 = v * v;
    return v2 * v2 * v;
}
vec2 pow5(const in vec2 v) {
    vec2 v2 = v * v;
    return v2 * v2 * v;
}
vec3 pow5(const in vec3 v) {
    vec3 v2 = v * v;
    return v2 * v2 * v;
}
vec4 pow5(const in vec4 v) {
    vec4 v2 = v * v;
    return v2 * v2 * v;
}
#endif

#ifndef FNC_SCHLICK
#define FNC_SCHLICK
// Schlick 1994, "An Inexpensive BRDF Model for Physically-Based Rendering"
vec3 schlick(const in vec3 f0, const in float f90, const in float VoH) {
    float f = pow5(1.0 - VoH);
    return f + f0 * (f90 - f);
}
vec3 schlick(const in vec3 f0, const in vec3 f90, const in float VoH) {
    return f0 + (f90 - f0) * pow5(1.0 - VoH);
}
float schlick(const in float f0, const in float f90, const in float VoH) {
    return f0 + (f90 - f0) * pow5(1.0 - VoH);
}
#endif



/*
contributors: Patricio Gonzalez Vivo
description: Resolve fresnel coefficient
use:
    - <float|vec3> fresnel(const <float|vec3> f0, <float> NoV)
    - <float|vec3> fresnel(const <float|vec3> f0, <float> NoV, float roughness)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_FRESNEL
#define FNC_FRESNEL
vec3 fresnel(const in vec3 f0, vec3 normal, vec3 view) {
   return schlick(f0, 1.0, dot(view, normal));
}
vec3 fresnel(const in vec3 f0, const in float NoV) {
#if defined(TARGET_MOBILE) || defined(PLATFORM_RPI)
    return schlick(f0, 1.0, NoV);
#else
    float f90 = saturate(dot(f0, vec3(50.0 * 0.33)));
    return schlick(f0, f90, NoV);
#endif
}
float fresnel(const in float f0, const in float NoV) {
    return schlick(f0, 1.0, NoV);
}
// Roughness-adjusted fresnel function to attenuate high speculars at glancing angles
// Very useful when used with filtered environment maps
// See https://seblagarde.wordpress.com/2011/08/17/hello-world/
vec3 fresnel(vec3 f0, float NoV, float roughness) {
    return f0 + (max(vec3(1.0 - roughness), f0) - f0) * pow5(1.0 - NoV);
}
#endif
#ifndef FNC_SPECULAR_COOKTORRANCE
#define FNC_SPECULAR_COOKTORRANCE
vec3 specularCookTorrance(const in vec3 L, const in vec3 N, const in vec3 H, const in float NoV, const in float NoL, const in float NoH, const in float linearRoughness, const in vec3 specularColor) {
    float LoH = saturate(dot(L, H));
    float D = GGX(N, H, NoH, linearRoughness);
#if defined(PLATFORM_RPI)
    float V = smithGGXCorrelated_Fast(NoV, NoL, linearRoughness);
#else
    float V = smithGGXCorrelated(NoV, NoL,linearRoughness);
#endif
    vec3 F = fresnel(specularColor, LoH);
    return (D * V) * F;
}
vec3 specularCookTorrance(ShadingData shadingData){
    return specularCookTorrance(shadingData.L, shadingData.N, shadingData.H, shadingData.NoV, shadingData.NoL, shadingData.NoH, shadingData.linearRoughness, shadingData.specularColor); 
}
#endif
#ifndef FNC_SPECULAR_GAUSSIAN
#define FNC_SPECULAR_GAUSSIAN
// https://github.com/glslify/glsl-specular-gaussian
float specularGaussian(const in float NoH, const in float roughness) {
    float theta = acos(NoH);
    float w = theta / roughness;
    return exp(-w*w);
}
float specularGaussian(ShadingData shadingData) {
    return specularGaussian(shadingData.NoH, shadingData.roughness);
}
#endif

// https://github.com/glslify/glsl-specular-beckmann
#ifndef FNC_BECKMANN
#define FNC_BECKMANN
float beckmann(const in float _NoH, const in float roughness) {
    float NoH = max(_NoH, 0.0001);
    float cos2Alpha = NoH * NoH;
    float tan2Alpha = (cos2Alpha - 1.0) / cos2Alpha;
    float roughness2 = roughness * roughness;
    float denom = PI * roughness2 * cos2Alpha * cos2Alpha;
    return exp(tan2Alpha / roughness2) / denom;
}
#endif
#ifndef FNC_SPECULAR_BECKMANN
#define FNC_SPECULAR_BECKMANN
float specularBeckmann(ShadingData shadingData) {
    return beckmann(shadingData.NoH, shadingData.roughness);
}
#endif
/*
contributors: Patricio Gonzalez Vivo
description: Calculate specular contribution
use:
    - specular(<vec3> L, <vec3> N, <vec3> V, <float> roughness[, <float> fresnel])
    - specular(<vec3> L, <vec3> N, <vec3> V, <float> NoV, <float> NoL, <float> roughness, <float> fresnel)
options:
    - SPECULAR_FNC: specularGaussian, specularBeckmann, specularCookTorrance (default), specularPhongRoughness, specularBlinnPhongRoughness (default on mobile)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef SPECULAR_FNC
#if defined(TARGET_MOBILE) || defined(PLATFORM_RPI) || defined(PLATFORM_WEBGL)
#define SPECULAR_FNC specularBlinnPhongRoughness
#else
#define SPECULAR_FNC specularCookTorrance
#endif  
#endif
#ifndef FNC_SPECULAR
#define FNC_SPECULAR
vec3 specular(ShadingData shadingData) { return vec3(1.0, 1.0, 1.0) * SPECULAR_FNC(shadingData); }
#endif




/*
contributors: Patricio Gonzalez Vivo
description: "Resolve fresnel coefficient and apply it to a reflection. It can apply\
    \ iridescence to \nusing a formula based on https://www.alanzucconi.com/2017/07/25/the-mathematics-of-thin-film-interference/\n"
use:
    - <vec3> fresnelReflection(<vec3> R, <vec3> f0, <float> NoV)
    - <vec3> fresnelIridescentReflection(<vec3> normal, <vec3> view, <vec3> f0, <vec3> ior1, <vec3> ior2, <float> thickness, <float> roughness)
    - <vec3> fresnelReflection(<Material> _M)
options:
    - FRESNEL_REFLECTION_RGB: <vec3> RGB values of the reflection
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FRESNEL_REFLECTION_RGB
#define FRESNEL_REFLECTION_RGB vec3(612.0, 549.0, 464.0)
#endif
#ifndef FNC_FRESNEL_REFLECTION
#define FNC_FRESNEL_REFLECTION
vec3 fresnelReflection(const in vec3 R, const in vec3 f0, const in float NoV) {
    vec3 frsnl = fresnel(f0, NoV);
    vec3 reflectColor = vec3(0.0);
    #if defined(FRESNEL_REFLECTION_FNC)
    reflectColor = FRESNEL_REFLECTION_FNC(R);
    #else
    reflectColor = envMap(R, 1.0, 0.001);
    #endif
    return reflectColor * frsnl;
}
vec3 fresnelReflection(const in vec3 R, const in vec3 Fr) {
    vec3 reflectColor = vec3(0.0);
    #if defined(FRESNEL_REFLECTION_FNC)
    reflectColor = FRESNEL_REFLECTION_FNC(R);
    #else
    reflectColor = envMap(R, 1.0, 0.001);
    #endif
    return reflectColor * Fr;
}
vec3 fresnelIridescentReflection(vec3 normal, vec3 view, float f0, float ior1, float ior2, float thickness, float roughness, 
                                 inout float Fr) {
    float cos0 = -dot(view, normal);
    Fr = fresnel(f0, cos0);
    float T = 1.0 - Fr;
    float a = ior1/ior2;
    float cosi2 = sqrt(1.0 - a * a * (1.0 - cos0*cos0));
    vec3 shift = 4.0 * PI * (thickness/FRESNEL_REFLECTION_RGB) * ior2 * cosi2 + HALF_PI;
    vec3 irid = Fr * ( 1.0 + T * ( T + 2.0 * cos(shift) ) );
    vec3 ref = envMap(reflect(view, normal), roughness, 0.0);
    return (ref + pow5(ref)) * irid;
}
vec3 fresnelIridescentReflection(vec3 normal, vec3 view, float f0, float ior1, float ior2, float thickness, float roughness) {
    float Fr = 0.0;
    return fresnelIridescentReflection(normal, view, f0, ior1, ior2, thickness, roughness, Fr);
}
vec3 fresnelIridescentReflection(vec3 normal, vec3 view, vec3 f0, vec3 ior1, vec3 ior2, float thickness, float roughness,
                                 inout vec3 Fr) {
    float cos0 = -dot(view, normal);
    Fr = fresnel(f0, cos0);
    vec3 T = 1.0 - Fr;
    vec3 a = ior1/ior2;
    vec3 cosi2 = sqrt(1.0 - a * a * (1.0 - cos0*cos0));
    vec3 shift = 4.0 * PI * (thickness/FRESNEL_REFLECTION_RGB) * ior2 * cosi2 + HALF_PI;
    vec3 irid = Fr * ( 1.0 + T * ( T + 2.0 * cos(shift) ) );
    vec3 ref = envMap(reflect(view, normal), roughness, 0.0);
    return (ref + pow5(ref)) * irid;
}
vec3 fresnelIridescentReflection(vec3 normal, vec3 view, vec3 f0, vec3 ior1, vec3 ior2, float thickness, float roughness) {
    vec3 Fr = vec3(0.0);
    return fresnelIridescentReflection(normal, view, f0, ior1, ior2, thickness, roughness, Fr);
}
vec3 fresnelIridescentReflection(vec3 normal, vec3 view, float ior1, float ior2, float thickness, float roughness) {
    float F0 = (ior2-1.)/(ior2+1.);
    return fresnelIridescentReflection(normal, view, F0 * F0, ior1, ior2, thickness, roughness);
}
vec3 fresnelIridescentReflection(vec3 normal, vec3 view, vec3 ior1, vec3 ior2, float thickness, float roughness) {
    vec3 F0 = (ior2-1.)/(ior2+1.);
    return fresnelIridescentReflection(normal, view, F0 * F0, ior1, ior2, thickness, roughness);
}
vec3 fresnelReflection(Material _M, ShadingData shadingData) {
    vec3 f0 = vec3(0.04, 0.04, 0.04);
    #if defined(SHADING_MODEL_IRIDESCENCE)
    return fresnelIridescentReflection(_M.normal, -shadingData.V, f0, vec3(IOR_AIR, IOR_AIR, IOR_AIR), _M.ior, _M.thickness, _M.roughness);
    #else
    return fresnelReflection(shadingData.R, f0, shadingData.NoV) * (1.0-_M.roughness);
    #endif
}
#endif


/*
contributors: Patricio Gonzalez Vivo
description: Index of refraction to ratio of index of refraction
use: <float|vec3|vec4> ior2eta(<float|vec3|vec4> ior)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_IOR2ETA
#define FNC_IOR2ETA
float ior2eta( const in float ior ) { return 1.0/ior; }
vec3 ior2eta( const in vec3 ior ) { return 1.0/ior; }
vec4 ior2eta( const in vec4 ior ) { return vec4(1.0/ior.rgb, ior.a); }
#endif
/*
contributors: Patricio Gonzalez Vivo
description: power of 2
use: <float|vec2|vec3|vec4> pow2(<float|vec2|vec3|vec4> v)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_POW2
#define FNC_POW2
float pow2(const in float v) { return v * v; }
vec2 pow2(const in vec2 v) { return v * v; }
vec3 pow2(const in vec3 v) { return v * v; }
vec4 pow2(const in vec4 v) { return v * v; }
#endif

/*
contributors: Patricio Gonzalez Vivo
description: Index of refraction to reflectance at 0 degree https://handlespixels.wordpress.com/tag/f0-reflectance/
use: <float|vec3|vec4> ior2f0(<float|vec3|vec4> ior)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef FNC_IOR2F0
#define FNC_IOR2F0
float ior2f0(const in float ior) { return pow2(ior - 1.0) / pow2(ior + 1.0); }
vec3 ior2f0(const in vec3 ior) { return pow2(ior - 1.0) / pow2(ior + 1.0); }
vec4 ior2f0(const in vec4 ior) { return vec4(pow2(ior.rgb - 1.0) / pow2(ior.rgb + 1.0), ior.a); }
#endif
/*
contributors: Patricio Gonzalez Vivo
description: This function simulates the refraction of light through a transparent material. It uses the Schlick's approximation to calculate the Fresnel reflection and the Snell's law to calculate the refraction. It also uses the envMap function to simulate the dispersion of light through the material.
use:
    - <vec3> transparent(<vec3> normal, <vec3> view, <vec3> ior, <float> roughness)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#if !defined(TRANSPARENT_DISPERSION) && defined(TRANSPARENT_DISPERSION_PASSES)
#define TRANSPARENT_DISPERSION 0.05
#elif defined(TRANSPARENT_DISPERSION) && !defined(TRANSPARENT_DISPERSION_PASSES)
#define TRANSPARENT_DISPERSION_PASSES 6
#endif
#ifndef FNC_TRANSPARENT
#define FNC_TRANSPARENT
vec3 transparent(vec3 normal, vec3 view, vec3 Fr, vec3 eta, float roughness) {
    vec3 color  = vec3(0.0);
    vec3 T      = max(vec3(0.0), 1.0-Fr);
    #if defined(TRANSPARENT_DISPERSION) && defined(TRANSPARENT_DISPERSION_PASSES)
        float pass_step = 1.0/float(TRANSPARENT_DISPERSION_PASSES);
        vec3 bck = vec3(0.0);
        for ( int i = 0; i < TRANSPARENT_DISPERSION_PASSES; i++ ) {
            float slide = float(i) * pass_step * TRANSPARENT_DISPERSION;
            vec3 R      = refract(view, normal, eta.g );
            vec3 ref    = envMap(R, roughness, 0.0);
            #if !defined(TRANSPARENT_DISPERSION_FAST) && !defined(TARGET_MOBILE) && !defined(PLATFORM_RPI)
            ref.r       = envMap(refract(view, normal, eta.r - slide), roughness, 0.0).r;
            ref.b       = envMap(refract(view, normal, eta.b + slide), roughness, 0.0).b;
            #endif
            bck += ref;
        }
        color.rgb   = bck * pass_step;
    #else 
        vec3 R      = refract(view, normal, eta.g);
        color       = envMap(R, roughness);
        #if !defined(TRANSPARENT_DISPERSION_FAST) && !defined(TARGET_MOBILE) && !defined(PLATFORM_RPI)
        vec3 RaR    = refract(view, normal, eta.r);
        vec3 RaB    = refract(view, normal, eta.b);
        color.r     = envMap(RaR, roughness).r;
        color.b     = envMap(RaB, roughness).b;
        #endif
    #endif
    return color*T*T*T*T;
}
vec3 transparent(vec3 normal, vec3 view, float Fr, vec3 eta, float roughness) {
    vec3 color  = vec3(0.0);
    float T     = max(0.0, 1.0-Fr);
    #if defined(TRANSPARENT_DISPERSION) && defined(TRANSPARENT_DISPERSION_PASSES)
        float pass_step = 1.0/float(TRANSPARENT_DISPERSION_PASSES);
        vec3 bck = vec3(0.0);
        for ( int i = 0; i < TRANSPARENT_DISPERSION_PASSES; i++ ) {
            float slide = float(i) * pass_step * TRANSPARENT_DISPERSION;
            vec3 R      = refract(view, normal, eta.g );
            vec3 ref    = envMap(R, roughness, 0.0);
            #if !defined(TRANSPARENT_DISPERSION_FAST) && !defined(TARGET_MOBILE) && !defined(PLATFORM_RPI)
            ref.r       = envMap(refract(view, normal, eta.r - slide), roughness, 0.0).r;
            ref.b       = envMap(refract(view, normal, eta.b + slide), roughness, 0.0).b;
            #endif
            bck += ref;
        }
        color.rgb   = bck * pass_step;
    #else 
        vec3 R      = refract(view, normal, eta.g);
        color       = envMap(R, roughness);
        #if !defined(TRANSPARENT_DISPERSION_FAST) && !defined(TARGET_MOBILE) && !defined(PLATFORM_RPI)
        vec3 RaR    = refract(view, normal, eta.r);
        vec3 RaB    = refract(view, normal, eta.b);
        color.r     = envMap(RaR, roughness).r;
        color.b     = envMap(RaB, roughness).b;
        #endif
    #endif
    return color*T*T*T*T;
}
#endif




// See section 4.10.2 in Sebastien Lagarde: Moving Frostbite to Physically Based Rendering 3.0
// https://seblagarde.wordpress.com/wp-content/uploads/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf

#if !defined(TARGET_MOBILE) && !defined(PLATFORM_RPI) && !defined(PLATFORM_WEBGL)
#define IBL_SPECULAR_OCCLUSION
#endif
#ifndef FNC_SPECULARAO
#define FNC_SPECULARAO
float specularAO(Material mat, ShadingData shadingData, const in float ao) {
#if !defined(TARGET_MOBILE) && !defined(PLATFORM_RPI) && !defined(PLATFORM_WEBGL)
    return saturate(pow(shadingData.NoV + ao, exp2(-16.0 * mat.roughness - 1.0)) - 1.0 + ao);
#else
    return 1.0;
#endif
}
#endif
#ifndef FNC_ENVBRDFAPPROX
#define FNC_ENVBRDFAPPROX
vec2 envBRDFApprox(const in float _NoV, in float _roughness ) {
    const vec4 c0 = vec4( -1.0, -0.0275, -0.572, 0.022 );
    const vec4 c1 = vec4( 1.0, 0.0425, 1.04, -0.04 );
    vec4 r = _roughness * c0 + c1;
    float a004 = min( r.x * r.x, exp2( -9.28 * _NoV ) ) * r.x + r.y;
    vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;
    return vec2(AB.x, AB.y);
}
//https://www.unrealengine.com/en-US/blog/physically-based-shading-on-mobile
vec3 envBRDFApprox(const in vec3 _specularColor, const in float _NoV, const in float _roughness) {
    vec2 AB = envBRDFApprox(_NoV, _roughness);
    return _specularColor * AB.x + AB.y;
}
vec3 envBRDFApprox(ShadingData shadingData) {
    return envBRDFApprox(shadingData.specularColor, shadingData.NoV, shadingData.roughness);
}
#endif
/*
contributors: Patricio Gonzalez Vivo
description: Simple glass shading model
use:
    - <vec4> glass(<Material> material)
options:
    - SPECULAR_FNC: specularGaussian, specularBeckmann, specularCookTorrance (default), specularPhongRoughness, specularBlinnPhongRoughness (default on mobile)
    - SCENE_BACK_SURFACE: null
    - LIGHT_POSITION: in GlslViewer is u_light
    - LIGHT_DIRECTION: null
    - LIGHT_COLOR in GlslViewer is u_lightColor
    - CAMERA_POSITION: in GlslViewer is u_camera
examples:
    - /shaders/lighting_raymarching_glass.frag
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/
#ifndef CAMERA_POSITION
#define CAMERA_POSITION vec3(0.0, 0.0, -10.0)
#endif
#ifndef IBL_LUMINANCE
#define IBL_LUMINANCE   1.0
#endif
#ifndef FNC_PBRGLASS
#define FNC_PBRGLASS
vec4 pbrGlass(const Material mat, ShadingData shadingData) {
    // Shading Data
    // ------------
#if defined(SCENE_BACK_SURFACE)
    vec3 No     = normalize(mat.normal - mat.normal_back); // Normal out is the difference between the front and back normals
#else
    vec3 No     = mat.normal;                            // Normal out
#endif
    vec3 eta    = ior2eta(mat.ior);
    vec3 f0     = vec3(0.04, 0.04, 0.04);
    shadingData.N = mat.normal;
    shadingData.R = reflection(shadingData.V,  shadingData.N, mat.roughness);
    shadingData.roughness = mat.roughness; 
    shadingData.linearRoughness = mat.roughness;
    shadingData.specularColor = mat.albedo.rgb;
    shadingData.NoV = dot(No, shadingData.V);
    // Indirect Lights ( Image Based Lighting )
    // ----------------------------------------
    vec3 E = envBRDFApprox(shadingData);
    vec3 Gi = envMap(mat, shadingData) * E;
    #if defined(SHADING_MODEL_IRIDESCENCE)
    vec3 Fr = vec3(0.0, 0.0, 0.0);
    Gi  += fresnelIridescentReflection(mat.normal, -shadingData.V, f0, vec3(IOR_AIR),
        mat.ior, mat.thickness, mat.roughness, Fr);
    #else
    vec3 Fr = fresnel(f0, shadingData.NoV);
    Gi  += fresnelReflection(shadingData.R, Fr) * (1.0-mat.roughness);
    #endif
    vec4 color  = vec4(0.0, 0.0, 0.0, 1.0);
    // Refraction
    color.rgb   += transparent(No, -shadingData.V, Fr, eta, mat.roughness);
    color.rgb   += Gi * IBL_LUMINANCE * mat.ambientOcclusion;
    // TODO: RaG
    //  - Add support for multiple lights
    // 
    {
        #if defined(LIGHT_DIRECTION)
        LightDirectional L = LightDirectionalNew();
        #elif defined(LIGHT_POSITION)
        LightPoint L = LightPointNew();
        #endif
        #if defined(LIGHT_DIRECTION) || defined(LIGHT_POSITION)
        shadingData.L = L.direction;
        shadingData.H = normalize(L.direction + shadingData.V);
        shadingData.NoL = saturate(dot(shadingData.N, L.direction));
        shadingData.NoH = saturate(dot(shadingData.N, shadingData.H));
        vec3 spec = specular(shadingData);
        color.rgb += L.color * spec;
        #endif
    }
    return color;
}
vec4 pbrGlass(const in Material mat) {
    ShadingData shadingData = shadingDataNew();
    shadingData.V = normalize(CAMERA_POSITION - mat.position);
    return pbrGlass(mat, shadingData);
}
#endif
