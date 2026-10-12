// #### Branch-Less Useless Ray-Tracer ####

// ==== CAMERA CONTROLS ====

#iUniform float hFoV = 90. in { 1., 179. }

// ==== CONSTANTS AND UTILS ====

const float PI = 3.141592653589793;
const float HUGE = 1e100;
const float EPSILON = 1e-5;

float rand(inout vec2 seed) {
  seed.x = fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
  seed.y = fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
  return seed.x;
}

vec3 slerp(in vec3 a, in vec3 b, in float t) {
  float omega = acos(dot(a, b));
  return normalize(a * sin((1. - t) * omega) + b * sin(t * omega));
}

int ternary(bool cond, int yes, int no) { return int(cond) * yes + int(!cond) * no; }
float ternary(bool cond, float yes, float no) { return float(cond) * yes + float(!cond) * no; }
vec3 ternary(bool cond, vec3 yes, vec3 no) { return float(cond) * yes + float(!cond) * no; }
mat3 ternary(bool cond, mat3 yes, mat3 no) { return float(cond) * yes + float(!cond) * no; }

// ==== STRUCT DEFINITION ====

struct Material {
  mat3 coat;
  vec3 emissive;
  float roughness;
};

struct Triangle {
  vec3 v1, v2, v3;
  int mat;
};

// ==== SCENE DECLARATION ====

const vec3 SKYBOX = vec3(0, 0, 0);

const Material[3] MATERIALS = Material[3] (
  Material(mat3(0.8, 0, 0, 0, 1, 0, 0, 0, 0.8), vec3(0, 0, 0), 0.5),
  Material(mat3(0, 0, 0, 0, 0, 0, 0, 0, 0), vec3(1, 0, 0), 1.),
  Material(mat3(0, 0, 0, 0, 0, 0, 0, 0, 0), vec3(1, 1, 1), 1.));

const Triangle[22] TRIANGLES = Triangle[22] (
  Triangle(vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, -0.5), vec3(0.5, -0.5, 0.5), 0),
  Triangle(vec3(0.5, -0.5, -0.5), vec3(0.5, -0.5, 0.5), vec3(0.5, 0.5, -0.5), 0),
  Triangle(vec3(-0.5, 0.5, -0.5), vec3(-0.5, 0.5, 0.5), vec3(-0.5, -0.5, -0.5), 0),
  Triangle(vec3(-0.5, -0.5, 0.5), vec3(-0.5, -0.5, -0.5), vec3(-0.5, 0.5, 0.5), 0),
  Triangle(vec3(-0.5, 0.5, -0.5), vec3(0.5, 0.5, -0.5), vec3(-0.5, 0.5, 0.5), 2),
  Triangle(vec3(0.5, 0.5, 0.5), vec3(-0.5, 0.5, 0.5), vec3(0.5, 0.5, -0.5), 2),
  Triangle(vec3(-0.5, -0.5, 0.5), vec3(0.5, -0.5, 0.5), vec3(-0.5, -0.5, -0.5), 0),
  Triangle(vec3(0.5, -0.5, -0.5), vec3(-0.5, -0.5, -0.5), vec3(0.5, -0.5, 0.5), 0),
  Triangle(vec3(-0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(-0.5, -0.5, 0.5), 0),
  Triangle(vec3(0.5, -0.5, 0.5), vec3(-0.5, -0.5, 0.5), vec3(0.5, 0.5, 0.5), 0),
  Triangle(vec3(0.3236365901200071, -0.5, -0.04604542648836482), vec3(0.3236365901200071, 0.125, -0.04604542648836482), vec3(0.10854542648836482, -0.5, 0.2611365901200071), 1),
  Triangle(vec3(0.10854542648836482, 0.125, 0.2611365901200071), vec3(0.10854542648836482, -0.5, 0.2611365901200071), vec3(0.3236365901200071, 0.125, -0.04604542648836482), 1),
  Triangle(vec3(-0.09624258458388313, -0.5, 0.11774248103224558), vec3(-0.09624258458388313, 0.125, 0.11774248103224558), vec3(0.11884857904775914, -0.5, -0.18943953557612633), 1),
  Triangle(vec3(0.11884857904775914, 0.125, -0.18943953557612633), vec3(0.11884857904775914, -0.5, -0.18943953557612633), vec3(-0.09624258458388313, 0.125, 0.11774248103224558), 1),
  Triangle(vec3(0.10854542648836482, 0.125, 0.2611365901200071), vec3(0.3236365901200071, 0.125, -0.04604542648836482), vec3(-0.09624258458388313, 0.125, 0.11774248103224558), 1),
  Triangle(vec3(0.11884857904775914, 0.125, -0.18943953557612633), vec3(-0.09624258458388313, 0.125, 0.11774248103224558), vec3(0.3236365901200071, 0.125, -0.04604542648836482), 1),
  Triangle(vec3(0.3236365901200071, -0.5, -0.04604542648836482), vec3(0.10854542648836482, -0.5, 0.2611365901200071), vec3(0.11884857904775914, -0.5, -0.18943953557612633), 1),
  Triangle(vec3(-0.09624258458388313, -0.5, 0.11774248103224558), vec3(0.11884857904775914, -0.5, -0.18943953557612633), vec3(0.10854542648836482, -0.5, 0.2611365901200071), 1),
  Triangle(vec3(0.10854542648836482, -0.5, 0.2611365901200071), vec3(0.10854542648836482, 0.125, 0.2611365901200071), vec3(-0.09624258458388313, -0.5, 0.11774248103224558), 1),
  Triangle(vec3(-0.09624258458388313, 0.125, 0.11774248103224558), vec3(-0.09624258458388313, -0.5, 0.11774248103224558), vec3(0.10854542648836482, 0.125, 0.2611365901200071), 1),
  Triangle(vec3(0.11884857904775914, -0.5, -0.18943953557612633), vec3(0.11884857904775914, 0.125, -0.18943953557612633), vec3(0.3236365901200071, -0.5, -0.04604542648836482), 1),
  Triangle(vec3(0.3236365901200071, 0.125, -0.04604542648836482), vec3(0.3236365901200071, -0.5, -0.04604542648836482), vec3(0.11884857904775914, 0.125, -0.18943953557612633), 1));

// ==== HIT DETECTION ====

struct BakedTriangle {
  vec3 v1, v2, norm, n3, n1, n2;
  int mat;
};

BakedTriangle bakeTriangle(in Triangle t) {
  vec3 norm = normalize(cross(t.v2 - t.v1, t.v3 - t.v1));
  return BakedTriangle(
    t.v1, t.v2, norm,
    normalize(cross(norm, t.v2 - t.v1)),
    normalize(cross(norm, t.v3 - t.v2)),
    normalize(cross(norm, t.v1 - t.v3)),
    t.mat);
}

struct SceneHit {
  float dist;
  vec3 point, normal;
  int material;
};

SceneHit closest(in SceneHit a, in SceneHit b) {
  bool left = a.dist < b.dist;
  return SceneHit(
    ternary(left, a.dist, b.dist),
    ternary(left, a.point, b.point),
    ternary(left, a.normal, b.normal),
    ternary(left, a.material, b.material));
}

SceneHit rayTriangle(in vec3 ray_orig, in vec3 ray_dir, in BakedTriangle t) {
  float dist = dot(t.v1 - ray_orig, t.norm) / dot(ray_dir, t.norm);
  vec3 point = ray_orig + ray_dir * dist;
  bool oob = int(dist <= EPSILON) +
    int(dot(ray_dir, t.norm) >= 0.) +
    int(int(dot(t.n3, point - t.v2) * HUGE) < 0) +
    int(int(dot(t.n1, point - t.v2) * HUGE) < 0) +
    int(int(dot(t.n2, point - t.v1) * HUGE) < 0) != 0;
  return SceneHit(ternary(oob, HUGE, dist), point, t.norm, t.mat);
}

SceneHit rayScene(in vec3 ray_orig, in vec3 ray_dir) {
  SceneHit hit = SceneHit(HUGE, vec3(0), vec3(0), 0);
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[0])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[1])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[2])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[3])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[4])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[5])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[6])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[7])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[8])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[9])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[10])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[11])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[12])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[13])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[14])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[15])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[16])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[17])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[18])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[19])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[20])));
  hit = closest(hit, rayTriangle(ray_orig, ray_dir, bakeTriangle(TRIANGLES[21])));
  return hit;
}

// ==== RAY BOUNCING ===

void rayScene(inout vec3 ray_orig, inout vec3 ray_dir, inout vec3 col_acc, inout mat3 col_mat, inout vec2 seed) {
  SceneHit hit = rayScene(ray_orig, ray_dir);
  Material mat = MATERIALS[hit.material];
  col_acc += col_mat * ternary(hit.dist == HUGE, SKYBOX, mat.emissive);
  col_mat *= ternary(hit.dist == HUGE, mat3(0), mat.coat);
  ray_orig += ray_dir * hit.dist;
  ray_dir = reflect(ray_dir, hit.normal);
  float theta = 2. * PI * rand(seed);
  float phi = acos(2. * rand(seed) - 1.);
  vec3 rough = vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi));
  rough = ternary(dot(rough, hit.normal) < 0., -rough, rough);
  ray_dir = ternary(mat.roughness == 0., ray_dir, slerp(ray_dir, rough, mat.roughness));
}

vec3 ray(in vec3 ray_dir, inout vec2 seed) {
  vec3 ray_orig = vec3(0, 0, -1.5), col_acc = vec3(0);
  mat3 col_mat = mat3(1);
  rayScene(ray_orig, ray_dir, col_acc, col_mat, seed);
  rayScene(ray_orig, ray_dir, col_acc, col_mat, seed);
  rayScene(ray_orig, ray_dir, col_acc, col_mat, seed);
  rayScene(ray_orig, ray_dir, col_acc, col_mat, seed);
  rayScene(ray_orig, ray_dir, col_acc, col_mat, seed);
  rayScene(ray_orig, ray_dir, col_acc, col_mat, seed);
  return col_acc;
}

// ==== SAMPLING ===

void main() {
  vec2 seed = gl_FragCoord.xy + vec2(float(iFrame % 127) * .19, float(iFrame % 131) * .17);
  vec2 off = (gl_FragCoord.xy * 2. + 1. - iResolution.xy) / iResolution.xx;
  vec3 dir = normalize(vec3(off, 1. / tan(hFoV * PI / 360.)));
  vec3 col = ray(dir, seed);
  gl_FragColor = vec4(col, 1);
}
