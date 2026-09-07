import { cardSpace, tilt, vnoise, sheen, edgeLight, vignette, grain, saturate3 } from "./common.wgsl";

struct Params {
  time: f32,
  texel: vec2f,
  mouse: vec2f,
  base: vec3f,
  accent: vec3f,
}

@group(0) @binding(0) var<uniform> params: Params;

// Brushed metal: fine horizontal grooves, one broad pointer-driven sheen and a
// faint secondary band. Reads as anodised aluminium / gold plate.
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = cardSpace(uv, params.texel);
  let t = tilt(params.mouse);

  // Grooves: high frequency across y, low across x.
  let g1 = vnoise(vec2f(p.x * 14.0, p.y * 720.0));
  let g2 = vnoise(vec2f(p.x * 46.0 + 7.0, p.y * 1900.0));
  let groove = g1 * 0.62 + g2 * 0.38;

  let band = sheen(p, t, 0.0, 7.5);
  let band2 = sheen(p, t, 0.62, 26.0) * 0.45;
  let band3 = sheen(p, t, -0.7, 34.0) * 0.3;

  var col = params.base * (0.66 + 0.34 * groove);
  col += params.accent * (band * 0.42 + band2 * 0.22 + band3 * 0.16) * (0.75 + 0.25 * groove);
  // Sparkle where the sheen hits raised grooves.
  col += vec3f(1.0) * pow(groove, 7.0) * band * 0.28;

  // Light falls from the top.
  col *= 0.92 + 0.16 * (1.0 - uv.y) + t.y * 0.04;
  col += params.accent * edgeLight(uv) * 0.22;
  col *= vignette(uv, 0.7);
  col += grain(uv, 0.035);

  return vec4f(saturate3(col), 1.0);
}
