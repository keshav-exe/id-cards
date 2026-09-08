import { cardSpace, tilt, sheen, edgeLight, vignette, grain, hueRotate, chroma, saturate3 } from "./common.wgsl";

struct Params {
  time: f32,
  texel: vec2f,
  mouse: vec2f,
  base: vec3f,
  accent: vec3f,
}

@group(0) @binding(0) var<uniform> params: Params;

// Tight OVD ramp: gold → brand → cool cyan. Passport foil, not a rainbow print.
fn ovdRamp(t: f32) -> vec3f {
  let sat = smoothstep(0.03, 0.2, chroma(params.accent));
  let gold = mix(vec3f(0.76, 0.66, 0.42), params.accent, 0.35 * sat);
  let mid = mix(params.accent, vec3f(1.0), 0.12);
  let cool = mix(vec3f(0.40, 0.58, 0.66), hueRotate(params.accent, 0.7), sat);
  let s = clamp(t, 0.0, 1.0) * 2.0;
  if (s < 1.0) { return mix(gold, mid, s); }
  return mix(mid, cool, s - 1.0);
}

// Soft guilloché: concentric + radial, dies out away from the seal.
fn guilloche(p: vec2f) -> f32 {
  let r = length(p);
  let ang = atan2(p.y, p.x);
  let rose = sin(r * 42.0) * sin(ang * 10.0);
  let rings = sin(r * 28.0 + ang * 2.0);
  return (rose * 0.65 + rings * 0.35) * smoothstep(0.55, 0.08, r);
}

// Laminated PVC with a thin-film OVD. The body stays the finish colour;
// foil only flashes on tilt — a security overlay, not wallpaper.
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = cardSpace(uv, params.texel);
  let q = p - vec2f(params.texel.y / max(params.texel.x, 1e-6) * 0.5, 0.5);
  let t = tilt(params.mouse);
  let view = normalize(vec3f(t.x * 0.55, t.y * 0.55, 0.92));
  let grazing = pow(1.0 - clamp(view.z, 0.12, 1.0), 1.6);

  let band = sheen(p, t, 0.04, 3.2);
  let glint = sheen(p, t, -0.28, 11.0);
  let hueT = 0.42 + t.x * 0.16 + t.y * 0.08 + (q.x + q.y) * 0.06 + band * 0.12;
  let foil = ovdRamp(hueT);

  var col = params.base;
  col = mix(col, foil, 0.05 + 0.22 * grazing + 0.16 * band);
  col += vec3f(0.92, 0.90, 0.82) * glint * 0.14;
  col += foil * guilloche(q - vec2f(0.28, 0.16)) * 0.05;

  col += params.accent * edgeLight(uv) * 0.16;
  col *= vignette(uv, 0.62);
  col += grain(uv, 0.018);

  return vec4f(saturate3(col), 1.0);
}
