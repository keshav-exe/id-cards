import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
