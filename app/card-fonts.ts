import {
  DM_Sans,
  EB_Garamond,
  Figtree,
  Geist,
  IBM_Plex_Sans,
  Instrument_Sans,
  Inter,
  JetBrains_Mono,
  Lora,
  Manrope,
  Merriweather,
  Montserrat,
  Noto_Sans,
  Noto_Serif,
  Nunito_Sans,
  Oxanium,
  Playfair_Display,
  Public_Sans,
  Raleway,
  Roboto,
  Roboto_Slab,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-card-geist",
  preload: false,
})
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-card-inter",
  preload: false,
})
const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-card-noto-sans",
  preload: false,
})
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-card-nunito-sans",
  preload: false,
})
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-card-figtree",
  preload: false,
})
const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-card-roboto",
  preload: false,
})
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-card-raleway",
  preload: false,
})
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-card-dm-sans",
  preload: false,
})
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-card-public-sans",
  preload: false,
})
const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-card-oxanium",
  preload: false,
})
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-card-manrope",
  preload: false,
})
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-card-space-grotesk",
  preload: false,
})
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-card-montserrat",
  preload: false,
})
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-card-ibm-plex-sans",
  preload: false,
})
const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-card-source-sans-3",
  preload: false,
})
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-card-instrument-sans",
  preload: false,
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-card-jetbrains-mono",
  preload: false,
})
const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-card-noto-serif",
  preload: false,
})
const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-card-roboto-slab",
  preload: false,
})
const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-card-merriweather",
  preload: false,
})
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-card-lora",
  preload: false,
})
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-card-playfair-display",
  preload: false,
})
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-card-eb-garamond",
  preload: false,
})

/** Extra card faces. Outfit / Geist Mono / Instrument Serif live in layout. */
export const cardFontVariables = [
  geist.variable,
  inter.variable,
  notoSans.variable,
  nunitoSans.variable,
  figtree.variable,
  roboto.variable,
  raleway.variable,
  dmSans.variable,
  publicSans.variable,
  oxanium.variable,
  manrope.variable,
  spaceGrotesk.variable,
  montserrat.variable,
  ibmPlexSans.variable,
  sourceSans3.variable,
  instrumentSans.variable,
  jetbrainsMono.variable,
  notoSerif.variable,
  robotoSlab.variable,
  merriweather.variable,
  lora.variable,
  playfairDisplay.variable,
  ebGaramond.variable,
]
