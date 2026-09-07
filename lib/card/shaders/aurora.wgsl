import { fbmSimplex2d, simplex2d } from "@vgpu/wgsl-std/noise/simplex";
import { cardSpace, tilt, sheen, edgeLight, vignette, grain, saturate3 } from "./common.wgsl";

struct Params {
  time: f32,
  texel: vec2f,
  mouse: vec2f,
  base: vec3f,
  accent: vec3f,
}

@group(0) @binding(0) var<uniform> params: Params;

// Frosted glass over slow-moving brand-coloured plasma. The glass layer is a
// fine grain plus a fixed gloss highlight near the top edge.
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = cardSpace(uv, params.texel);
  let t = tilt(params.mouse);
  let time = params.time * 0.045;

  // Large, soft plasma. Two octaves max so it stays a gradient, not clouds.
  let n1 = fbmSimplex2d(p * 0.8 + vec2f(time, -time * 0.7) + t * 0.1, 2, 2.17, 0.5);
  let n2 = simplex2d(p * 0.55 + vec2f(-time * 0.35, time * 0.5) + vec2f(31.0) + t * 0.06);

  let m1 = smoothstep(-0.75, 0.75, n1);
  let m2 = smoothstep(-0.8, 0.8, n2);

  let deep = params.base * 0.5;
  let bright = mix(params.accent, vec3f(1.0), 0.3);

  var col = mix(deep, params.base, m2);
  col = mix(col, params.accent, m1 * 0.9);
  col = mix(col, bright, pow(m1, 3.0) * 0.55);

  // Glass: one diagonal reflection that follows the pointer, fixed top gloss, frost.
  col += vec3f(1.0) * sheen(p, t, 0.15, 5.0) * 0.16;
  let gy = uv.y - 0.16 + t.y * 0.06 + (uv.x - 0.5) * 0.1;
  col += vec3f(1.0) * exp(-gy * gy * 80.0) * 0.12;
  col += vec3f(1.0) * edgeLight(uv) * 0.16;
  col *= vignette(uv, 0.5);
  col += grain(uv, 0.05);

  return vec4f(saturate3(col), 1.0);
}
