// bezier curve with 2 control points
// A is the starting point, B, C are the control points, D is the end point
// t from 0 ~ 1
vec3 bezier(vec3 start, vec3 startControl, vec3 endControl, vec3 end, float t) {
  vec3 E = mix(start, startControl, t);
  vec3 F = mix(startControl, endControl, t);
  vec3 G = mix(endControl, end, t);

  vec3 H = mix(E, F, t);
  vec3 I = mix(F, G, t);

  vec3 P = mix(H, I, t);

  return P;
}

float mapBezier(float value, float startCX, float startCY, float endCX, float endCY, float startX, float startY, float endX, float endY) {
    if (value == 0.0 || value == 1.0) {
        return value;
    }

    vec3 A = vec3(startX, startY, 0.0);
    vec3 B = vec3(startCX, startCY, 0.0);
    vec3 C = vec3(endCX, endCY, 0.0);
    vec3 D = vec3(endX, endY, 0.0);

    vec3 P = bezier(A, B, C, D, value);

    return P.y;
}

float mapBezier(float value, float startCX, float startCY, float endCX, float endCY) {
    return mapBezier(value, startCX, startCY, endCX, endCY, 0.0, 0.0, 1.0, 1.0);
}

vec3 mapBezier(vec3 value, float startCX, float startCY, float endCX, float endCY) {
    return vec3(mapBezier(value.x, startCX, startCY, endCX, endCY), mapBezier(value.y, startCX, startCY, endCX, endCY), mapBezier(value.z, startCX, startCY, endCX, endCY));
}

vec3 mapBezier(vec3 value, float startCX, float startCY, float endCX, float endCY, float startX, float startY, float endX, float endY) {
    return vec3(mapBezier(value.x, startCX, startCY, endCX, endCY, startX, startY, endX, endY), mapBezier(value.y, startCX, startCY, endCX, endCY, startX, startY, endX, endY), mapBezier(value.z, startCX, startCY, endCX, endCY, startX, startY, endX, endY));
}
