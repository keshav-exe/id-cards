import { fbmSimplex2d } from "@vgpu/wgsl-std/noise/simplex";
import { cardSpace, tilt, edgeLight, vignette, grain, saturate3 } from "./common.wgsl";

struct Params {
  time: f32,
  texel: vec2f,
  mouse: vec2f,
  base: vec3f,
  accent: vec3f,
}

@group(0) @binding(0) var<uniform> params: Params;

// Liquid chrome. A slow domain-warped height field is shaded as a mirror:
// reflections come from a two-tone brand "sky", plus a hard specular that
// tracks the pointer. Reads as poured metal / mercury.
fn height(q: vec2f) -> f32 {
  return fbmSimplex2d(q * 1.45, 3, 2.05, 0.48);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = cardSpace(uv, params.texel);
  let t = tilt(params.mouse);
  let time = params.time * 0.05;

  // Warp the domain so the surface flows instead of scrolling.
  let w1 = fbmSimplex2d(p * 1.4 + vec2f(time, -time * 0.6), 2, 2.0, 0.5);
  let w2 = fbmSimplex2d(p * 1.4 + vec2f(5.2 - time * 0.4, 1.3 + time * 0.5), 2, 2.0, 0.5);
  let q = p + vec2f(w1, w2) * 0.16 + t * 0.05;

  // Normal from finite differences of the height field.
  let e = 0.0035;
  let h = height(q);
  let hx = height(q + vec2f(e, 0.0)) - h;
  let hy = height(q + vec2f(0.0, e)) - h;
  let n = normalize(vec3f(-hx / e * 0.16, -hy / e * 0.16, 1.0));

  let view = normalize(vec3f(-t.x * 0.55, t.y * 0.55, 1.0));
  let light = normalize(vec3f(-0.35 + t.x * 0.7, 0.75 + t.y * 0.45, 0.55));
  let r = reflect(-view, n);

  // Environment: dark brand floor below, bright accent sky above.
  let sky = mix(params.accent, vec3f(1.0), 0.45);
  let floor = params.base * 0.32;
  let horizon = smoothstep(-0.55, 0.75, r.y);
  var env = mix(floor, sky, horizon);
  // A thin bright horizon line, like a studio softbox reflection.
  env += vec3f(1.0) * exp(-pow((r.y - 0.12) * 9.0, 2.0)) * 0.22;

  let fresnel = pow(1.0 - max(dot(n, view), 0.0), 3.0);
  let spec = pow(max(dot(r, light), 0.0), 64.0);
  let gloss = pow(max(dot(r, light), 0.0), 7.0);

  var col = mix(params.base * 0.6, env, 0.62 + 0.38 * fresnel);
  col += params.accent * gloss * 0.28;
  col += vec3f(1.0) * spec * 0.95;

  col += params.accent * edgeLight(uv) * 0.24;
  col *= vignette(uv, 0.55);
  col += grain(uv, 0.022);

  return vec4f(saturate3(col), 1.0);
}
