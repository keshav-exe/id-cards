import { cardSpace, tilt, edgeLight, vignette, grain, hueRotate, chroma, saturate3 } from "./common.wgsl";

struct Params {
  time: f32,
  texel: vec2f,
  mouse: vec2f,
  base: vec3f,
  accent: vec3f,
}

@group(0) @binding(0) var<uniform> params: Params;

// Four-stop ramp anchored on the brand accent; neutral accents fall back to a
// classic gold → cyan → magenta → steel foil.
fn foilRamp(t: f32) -> vec3f {
  let sat = smoothstep(0.06, 0.24, chroma(params.accent));
  let a0 = mix(vec3f(0.78, 0.58, 0.16), params.accent, sat);
  let a1 = mix(vec3f(0.18, 0.66, 0.62), hueRotate(params.accent, 2.094), sat);
  let a2 = mix(vec3f(0.66, 0.18, 0.48), hueRotate(params.accent, 4.189), sat);
  let a3 = mix(vec3f(0.62, 0.68, 0.74), mix(params.base, vec3f(0.72), 0.5), sat * 0.6);

  let s = fract(t) * 4.0;
  if (s < 1.0) { return mix(a0, a1, s); }
  if (s < 2.0) { return mix(a1, a2, s - 1.0); }
  if (s < 3.0) { return mix(a2, a3, s - 2.0); }
  return mix(a3, a0, s - 3.0);
}

// Fine engraved line-work; high frequency so it reads as texture, not stripes.
fn kinegram(p: vec2f) -> f32 {
  return sin(p.x * 96.0 + p.y * 9.0) * 0.6 + 0.4 * sin((p.x - p.y) * 44.0);
}

// Holographic laminate: thin-film interference driven by view angle, a
// kinegram line pattern and a guilloché seal.
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = cardSpace(uv, params.texel);
  let q = p - vec2f(params.texel.y / max(params.texel.x, 1e-6) * 0.5, 0.5);
  let t = tilt(params.mouse) * 0.8;
  let view = normalize(vec3f(t.x, t.y, 0.82));
  let ndotv = clamp(view.z, 0.08, 1.0);

  let lines = kinegram(q * 2.8 + t * 0.4);
  // Broad interference sweep across the card, textured by the line-work.
  let sweep = (q.x * 0.9 + q.y * 1.4) - t.x * 0.6 + t.y * 0.4;
  let film = cos((1.0 / ndotv) * 4.2 + sweep * 3.6 + lines * 0.22 + params.time * 0.16);
  let hue = film * 0.5 + 0.5 + t.x * 0.14 + t.y * 0.05 + params.time * 0.03;
  var col = foilRamp(hue);

  let blaze = smoothstep(0.1, 0.95, abs(film));
  col = mix(params.base, col, 0.2 + 0.36 * blaze);
  col += vec3f(0.62, 0.7, 0.66) * pow(max(film, 0.0), 12.0) * 0.3 * (0.6 + 0.4 * lines);

  // Guilloché seal, lower right.
  let seal = q - vec2f(0.34, 0.16);
  let r = length(seal);
  let ang = atan2(seal.y, seal.x);
  let rose = sin(r * 86.0 - params.time * 0.55) * sin(ang * 16.0);
  col += foilRamp(rose * 0.25 + params.time * 0.02) * (0.12 * clamp(1.0 - r * 3.4, 0.0, 1.0));

  col += vec3f(0.52, 0.56, 0.6) * edgeLight(uv) * 0.2;
  col *= vignette(uv, 1.1);
  col += grain(uv, 0.03);

  return vec4f(saturate3(col), 1.0);
}
