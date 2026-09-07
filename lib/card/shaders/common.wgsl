import { hash1 } from "@vgpu/wgsl-std/hash";

// Shared uniform block for every card material. `base` is the body colour of
// the material, `accent` the highlight/second colour. Both are 0–1 sRGB.
struct Params {
  time: f32,
  texel: vec2f,
  mouse: vec2f,
  base: vec3f,
  accent: vec3f,
}

// Card-space coordinates: x scaled by aspect so patterns aren't stretched.
export fn cardSpace(uv: vec2f, texel: vec2f) -> vec2f {
  let aspect = texel.y / max(texel.x, 1e-6);
  return vec2f(uv.x * aspect, uv.y);
}

// Pointer tilt in [-1, 1], y flipped so "up" on screen is +y.
export fn tilt(mouse: vec2f) -> vec2f {
  let t = (mouse - vec2f(0.5)) * 2.0;
  return vec2f(t.x, -t.y);
}

// Smooth value noise built on the std hash.
export fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let k = vec2f(127.1, 311.7);
  let a = hash1(dot(i, k));
  let b = hash1(dot(i + vec2f(1.0, 0.0), k));
  let c = hash1(dot(i + vec2f(0.0, 1.0), k));
  let d = hash1(dot(i + vec2f(1.0, 1.0), k));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Broad diagonal specular band that follows the pointer. `offset` shifts it.
export fn sheen(p: vec2f, t: vec2f, offset: f32, width: f32) -> f32 {
  let d = (p.x - 0.5) * 0.55 + (p.y - 0.5) - t.x * 0.32 + t.y * 0.26 + offset;
  return exp(-d * d * width);
}

// Bevel-style highlight along the card edges.
export fn edgeLight(uv: vec2f) -> f32 {
  return pow(abs(uv.x * 2.0 - 1.0), 12.0) + pow(abs(uv.y * 2.0 - 1.0), 14.0);
}

export fn vignette(uv: vec2f, strength: f32) -> f32 {
  return clamp(1.0 + strength * 0.2 - length(uv - vec2f(0.5)) * strength, 0.3, 1.0);
}

export fn grain(uv: vec2f, amount: f32) -> f32 {
  return (hash1(dot(uv, vec2f(127.1, 311.7))) - 0.5) * amount;
}

// Rotate a colour around the grey axis (Rodrigues). Cheap hue shift.
export fn hueRotate(c: vec3f, angle: f32) -> vec3f {
  let k = vec3f(0.57735);
  let ca = cos(angle);
  let sa = sin(angle);
  return c * ca + cross(k, c) * sa + k * dot(k, c) * (1.0 - ca);
}

export fn chroma(c: vec3f) -> f32 {
  return max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b);
}

export fn saturate3(c: vec3f) -> vec3f {
  return clamp(c, vec3f(0.0), vec3f(1.0));
}
