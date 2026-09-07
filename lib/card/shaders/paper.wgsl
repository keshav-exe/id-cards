import { cardSpace, tilt, vnoise, sheen, vignette, grain, saturate3 } from "./common.wgsl";

struct Params {
  time: f32,
  texel: vec2f,
  mouse: vec2f,
  base: vec3f,
  accent: vec3f,
}

@group(0) @binding(0) var<uniform> params: Params;

// Uncoated cardstock. Two crossing fibre directions, a coarse "tooth" bump
// lit by a raking light that leans with the pointer, and almost no sheen —
// the material is the absence of shine. Reads as Colorplan / letterpress.
fn tooth(p: vec2f) -> f32 {
  return vnoise(p * 150.0) * 0.6 + vnoise(p * 340.0 + 11.0) * 0.4;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = cardSpace(uv, params.texel);
  let t = tilt(params.mouse);

  // Long fibres laid in two directions, like laid paper.
  let fibreA = vnoise(vec2f(p.x * 210.0, p.y * 1400.0));
  let fibreB = vnoise(vec2f(p.x * 1300.0 + 7.0, p.y * 190.0));
  let fibre = fibreA * 0.55 + fibreB * 0.45;

  // Bump-lit tooth: raking light from top-left, follows the tilt a little.
  let e = 0.0025;
  let h = tooth(p);
  let dx = tooth(p + vec2f(e, 0.0)) - h;
  let dy = tooth(p + vec2f(0.0, e)) - h;
  let lightDir = normalize(vec2f(-0.7 + t.x * 0.5, 0.7 - t.y * 0.5));
  let rake = dot(normalize(vec2f(dx, dy) + vec2f(1e-4)), lightDir) * clamp(length(vec2f(dx, dy)) * 40.0, 0.0, 1.0);

  var col = params.base * (0.972 + 0.028 * fibre);
  col *= 1.0 + rake * 0.022;
  col *= 0.99 + 0.02 * h;

  // Uncoated stock still has one broad, very soft highlight.
  col += params.accent * sheen(p, t, 0.05, 2.4) * 0.045;
  // Light from above, gently.
  col *= 0.975 + 0.05 * (1.0 - uv.y);

  col *= vignette(uv, 0.32);
  col += grain(uv, 0.02);

  return vec4f(saturate3(col), 1.0);
}
