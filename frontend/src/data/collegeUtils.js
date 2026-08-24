import { TOKENS } from "../theme/tokens";

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

  if (COLLEGE_COLOR[normalizedCode]) {
    return COLLEGE_COLOR[normalizedCode];
  }

  let hash = 0;
  for (let i = 0; i < normalizedCode.length; i += 1) {
    hash = (hash * 31 + normalizedCode.charCodeAt(i)) >>> 0;
  }

  return COLLEGE_COLOR_PALETTE[hash % COLLEGE_COLOR_PALETTE.length];
}
