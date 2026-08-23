export const TOKENS = {
  dark: {
    bg: "#0A0D1A",
    bg2: "#0F1326",
    surface: "rgba(255,255,255,0.055)",
    surfaceStrong: "rgba(255,255,255,0.09)",
    border: "rgba(255,255,255,0.10)",
    text: "#F2F1FB",
    textMuted: "rgba(242,241,251,0.62)",
    textFaint: "rgba(242,241,251,0.38)",
  },
  light: {
    bg: "#F5F5FB",
    bg2: "#FFFFFF",
    surface: "rgba(255,255,255,0.75)",
    surfaceStrong: "rgba(255,255,255,0.95)",
    border: "rgba(20,18,31,0.08)",
    text: "#14121F",
    textMuted: "rgba(20,18,31,0.62)",
    textFaint: "rgba(20,18,31,0.40)",
  },
  primary: "#6D5DF6",
  primary2: "#A855F7",
  amber: "#F5A524",
  like: "#FB4570",
  super: "#38BDF8",
  ggits: "#6D5DF6",
  ggct: "#38BDF8",
  ggce: "#F5A524",
};

export const COLLEGE_COLOR = {
  GGITS: TOKENS.ggits,
  GGCT: TOKENS.ggct,
  GGCE: TOKENS.ggce,
};

export const COLLEGE_COLOR_PALETTE = [
  TOKENS.primary,
  TOKENS.super,
  TOKENS.amber,
  TOKENS.primary2,
  "#34D399",
  "#FB7185",
];

export function collegeColor(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (COLLEGE_COLOR[normalizedCode]) return COLLEGE_COLOR[normalizedCode];
  let hash = 0;
  for (let i = 0; i < normalizedCode.length; i++) {
    hash = (hash * 31 + normalizedCode.charCodeAt(i)) >>> 0;
  }
  return COLLEGE_COLOR_PALETTE[hash % COLLEGE_COLOR_PALETTE.length];
}
