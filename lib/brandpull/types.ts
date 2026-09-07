/**
 * Types for the vendored brandpull pipeline.
 * Source: https://github.com/suraj-xd/brandpull (MIT) — src/branding/types.ts
 */

export interface LogoPosition {
  top: number
  left: number
  width: number
  height: number
}

export interface LogoCandidate {
  src: string
  alt: string
  ariaLabel?: string
  title?: string
  isSvg: boolean
  isVisible: boolean
  location: "header" | "footer" | "body"
  position: LogoPosition
  indicators: {
    inHeader: boolean
    altMatch: boolean
    srcMatch: boolean
    classMatch: boolean
    hrefMatch: boolean
  }
  href?: string
  source: string
  logoSvgScore: number
}

export interface BorderRadiusCorners {
  topLeft: number | null
  topRight: number | null
  bottomRight: number | null
  bottomLeft: number | null
}

export interface StyleSnapshot {
  tag: string
  classes: string
  text: string
  rect: { w: number; h: number }
  colors: {
    text: string
    background: string
    border: string
    borderWidth: number | null
    borderTop: string
    borderTopWidth: number | null
    borderRight: string
    borderRightWidth: number | null
    borderBottom: string
    borderBottomWidth: number | null
    borderLeft: string
    borderLeftWidth: number | null
  }
  typography: {
    fontStack: string[]
    size: string | null
    weight: number | null
  }
  radius: number | null
  borderRadius: BorderRadiusCorners
  shadow: string | null
  isButton: boolean
  isNavigation: boolean
  hasCTAIndicator: boolean
  isInput: boolean
  inputMetadata: {
    type: string
    placeholder: string
    value: string
    required: boolean
    disabled: boolean
    name: string
    id: string
    label: string
  } | null
  isLink: boolean
}

export interface PageImage {
  type: "favicon" | "og" | "twitter" | "logo" | "logo-svg"
  src: string
}

export interface BackgroundCandidate {
  color: string
  source: string
  priority: number
  area?: number
}

export interface ExtractionError {
  context: string
  message: string
  timestamp: number
}

export interface RawBranding {
  cssData: { colors: string[]; spacings: number[]; radii: number[] }
  snapshots: StyleSnapshot[]
  images: PageImage[]
  logoCandidates: LogoCandidate[]
  brandName: string
  pageTitle: string
  pageUrl: string
  typography: {
    stacks: { body: string[]; heading: string[]; paragraph: string[] }
    sizes: { h1: string; h2: string; body: string }
  }
  frameworkHints: string[]
  colorScheme: "light" | "dark"
  pageBackground: string | null
  backgroundCandidates: BackgroundCandidate[]
  errors?: ExtractionError[]
}

export interface ButtonStyle {
  index: number
  text: string
  classes: string
  background: string
  textColor: string
  borderColor: string | null
  borderRadius: string
  borderRadiusCorners: {
    topLeft: string
    topRight: string
    bottomRight: string
    bottomLeft: string
  }
  shadow: string | null
  score?: number
  originalBackgroundColor?: string
  originalTextColor?: string
  originalBorderColor?: string
}

export interface InputStyle {
  type: string
  placeholder: string
  label: string
  name: string
  required: boolean
  classes: string
  background: string
  textColor: string | null
  borderColor: string | null
  borderRadius: string
  borderRadiusCorners: ButtonStyle["borderRadiusCorners"]
  shadow: string | null
}

export interface LogoSelection {
  selectedIndex: number
  confidence: number
  source: "heuristic" | "fallback" | "none"
  reasoning: string
}

export interface BrandingProfile {
  url?: string
  finalUrl: string
  brandName: string
  pageTitle?: string
  colorScheme: "light" | "dark"
  logo?: string | null
  fonts: { family: string; count: number }[]
  colors: {
    primary: string
    secondary?: string
    accent: string
    background: string
    textPrimary: string
    textSecondary?: string
    link: string
  }
  typography: {
    fontFamilies: { primary: string; heading: string }
    fontStacks: RawBranding["typography"]["stacks"]
    fontSizes: RawBranding["typography"]["sizes"]
  }
  spacing: { baseUnit: number; borderRadius: string }
  components: {
    input?: InputStyle
    buttonPrimary?: ButtonStyle
    buttonSecondary?: ButtonStyle
  }
  images: {
    logo: string | null
    logoHref?: string | null
    logoAlt?: string | null
    favicon: string | null
    ogImage: string | null
  }
  confidence: {
    logo?: number
    colors?: number
    buttons?: number
    overall?: number
  }
  diagnostics?: {
    logo?: LogoSelection
    errors?: ExtractionError[]
  }
  debug?: {
    buttons: ButtonStyle[]
    inputs: InputStyle[]
    logoCandidates: LogoCandidate[]
    frameworkHints: string[]
    backgroundCandidates: BackgroundCandidate[]
  }
}
