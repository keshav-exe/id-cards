import { normalizeBrand, type Brand, type BrandpullProfile } from "@/lib/brand"

/**
 * Famous-brand samples in brandpull's output shape. Logos are local SVGs so
 * the studio works offline and exports never depend on the network.
 */
const PROFILES: BrandpullProfile[] = [
  {
    brandName: "Linear",
    url: "https://linear.app/",
    logo: "/brands/linear.svg",
    colors: {
      primary: "#5E6AD2",
      accent: "#E4F222",
      background: "#08090A",
      textPrimary: "#F7F8F8",
    },
  },
  {
    brandName: "Vercel",
    url: "https://vercel.com/",
    logo: "/brands/vercel.svg",
    colors: {
      primary: "#0070F3",
      accent: "#FFFFFF",
      background: "#000000",
      textPrimary: "#FFFFFF",
    },
  },
  {
    brandName: "Apple",
    url: "https://apple.com/",
    logo: "/brands/apple.svg",
    colors: {
      primary: "#0071E3",
      accent: "#2997FF",
      background: "#F5F5F7",
      textPrimary: "#1D1D1F",
    },
  },
  {
    brandName: "Exa",
    url: "https://exa.ai/",
    logo: "/brands/exa.svg",
    colors: {
      primary: "#1840ED",
      accent: "#0143D9",
      background: "#181815",
      textPrimary: "#FFFFFF",
    },
  },
]

export const SAMPLE_BRANDS: Brand[] = PROFILES.map((profile) => {
  const brand = normalizeBrand(profile)
  const logo = profile.logo ?? null
  return {
    ...brand,
    logo,
    logos: logo ? [logo] : [],
    logoShape: "mark" as const,
  }
})
