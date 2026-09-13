import { useMemo, useState } from "react";
import { TOKENS } from "../theme/tokens";

export function useThemeMode(initialDark = true) {
  const [dark, setDark] = useState(initialDark);
  const t = useMemo(() => ({ ...TOKENS, ...(dark ? TOKENS.dark : TOKENS.light) }), [dark]);

  return { dark, setDark, t };
}
