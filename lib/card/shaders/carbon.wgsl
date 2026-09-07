import { cardSpace, tilt, sheen, edgeLight, vignette, grain, saturate3 } from "./common.wgsl";

struct Params {
  time: f32,
  texel: vec2f,
  mouse: vec2f,
  base: vec3f,
  accent: vec3f,
}

@group(0) @binding(0) var<uniform> params: Params;

// 2×2 twill carbon weave. Alternate cells run their fibres horizontally or
// vertically; each direction catches the sheen differently, which is what
// gives real carbon its shimmering checkerboard.
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = cardSpace(uv, params.texel);
  let t = tilt(params.mouse);

  let cells = 26.0;
  let q = p * cells;
  let ci = floor(q);
  let f = fract(q);
  let horizontal = ((i32(ci.x) + i32(ci.y)) & 1) == 0;

  // Three fibres per cell, cylindrical shading.
  let along = select(f.x, f.y, horizontal);
  let across = select(f.y, f.x, horizontal);
  let fibre = 0.5 + 0.5 * sin(across * 6.2832 * 3.0 - 1.5708);
  // Fibres dip under at the cell ends they cross.
  let dip = smoothstep(0.0, 0.18, along) * smoothstep(0.0, 0.18, 1.0 - along);

  let band = sheen(p, t, 0.0, 6.0);
  let band2 = sheen(p, t, 0.55, 20.0) * 0.4;
  let aniso = select(0.35, 0.9, horizontal) + select(0.55, 0.0, horizontal) * clamp(t.x, 0.0, 1.0);

  var col = params.base * (0.42 + 0.58 * fibre) * (0.55 + 0.45 * dip);
  col += params.accent * (band + band2) * aniso * fibre * 0.5;
  col += vec3f(1.0) * pow(fibre, 12.0) * band * aniso * 0.22;

  col *= 0.9 + 0.14 * (1.0 - uv.y);
  col += params.accent * edgeLight(uv) * 0.28;
  col *= vignette(uv, 0.8);
  col += grain(uv, 0.03);

  return vec4f(saturate3(col), 1.0);
}
