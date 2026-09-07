import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Playwright resolves its driver relative to its own files. Leave it
  // external so require paths stay intact. Chromium itself is downloaded at
  // runtime via @sparticuz/chromium-min — do NOT NFT-include the pack here
  // or Vercel dies packaging a 60MB+ function after a green build.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min"],
  outputFileTracingIncludes: {
    "/api/brand": [
      "./node_modules/playwright-core/**",
      "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/**",
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
