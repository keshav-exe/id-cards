import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Playwright resolves its driver relative to its own files, and
  // @sparticuz/chromium locates its Brotli-packed binary the same way.
  // Bundling either breaks the lookup.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  // nft misses playwright-core's browsers.json / utilsBundle (loaded via
  // computed require paths) and the Chromium .br archives. Force them in.
  // pnpm: the top-level entries are symlinks; the .pnpm globs catch the
  // real files.
  outputFileTracingIncludes: {
    "/api/brand": [
      "./node_modules/playwright-core/**",
      "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/**",
      "./node_modules/@sparticuz/chromium/**",
      "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/**",
    ],
  },
  turbopack: {
    rules: {
      "*.wgsl": {
        loaders: ["@vgpu/wgsl/loader-webpack"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    config.module ??= {}
    config.module.rules ??= []
    config.module.rules.push({
      test: /\.wgsl$/,
      loader: "@vgpu/wgsl/loader-webpack",
    })
    return config
  },
}

export default nextConfig
