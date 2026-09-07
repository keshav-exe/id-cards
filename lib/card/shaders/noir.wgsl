import { simplex2d } from "@vgpu/wgsl-std/noise/simplex";
import { cardSpace, tilt, sheen, edgeLight, vignette, grain, saturate3 } from "./common.wgsl";

struct Params {
  time: f32,
  texel: vec2f,
  mouse: vec2f,
  base: vec3f,
  accent: vec3f,
}

@group(0) @binding(0) var<uniform> params: Params;

// Smoked glass over a light source. The body is the base colour dimmed; the
// accent lives in a soft bloom that swings opposite the tilt (as if the light
// were behind the card), a fine scanline raster and a lit bevel. Reads as a
// neon sign seen through tinted glass.
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = cardSpace(uv, params.texel);
  let t = tilt(params.mouse);
  let aspect = params.texel.y / max(params.texel.x, 1e-6);
  let time = params.time * 0.08;

  var col = params.base * 0.62;

  // Primary bloom: sits low-right at rest, parallaxes against the pointer.
  let c1 = vec2f(aspect * 0.62 - t.x * 0.16, 0.72 + t.y * 0.14);
  let wobble = simplex2d(p * 1.6 + vec2f(time, -time * 0.7)) * 0.06;
  let d1 = length((p - c1) * vec2f(1.0, 1.25)) + wobble;
  col += params.accent * exp(-d1 * d1 * 7.0) * 0.72;
  // Hot core.
  col += mix(params.accent, vec3f(1.0), 0.5) * exp(-d1 * d1 * 38.0) * 0.28;

  // Secondary, dimmer bloom top-left for balance.
  let c2 = vec2f(aspect * 0.12 + t.x * 0.08, 0.16 - t.y * 0.08);
  let d2 = length(p - c2);
  col += params.accent * exp(-d2 * d2 * 5.0) * 0.22;

  // Fine raster, barely there — gives the "screen behind glass" read.
  let scan = 0.5 + 0.5 * sin(p.y * 1100.0);
  col *= 0.955 + 0.045 * scan;

  // Glass: one narrow reflection following the pointer, and a lit bevel.
  col += vec3f(1.0) * sheen(p, t, 0.12, 22.0) * 0.09;
  col += params.accent * edgeLight(uv) * 0.6;
  col += vec3f(1.0) * edgeLight(uv) * 0.08;

  col *= vignette(uv, 0.75);
  col += grain(uv, 0.03);

  return vec4f(saturate3(col), 1.0);
}
