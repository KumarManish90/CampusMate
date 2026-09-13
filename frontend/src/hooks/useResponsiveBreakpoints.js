import useMediaQuery from "./useMediaQuery";

export const BREAKPOINTS = {
  mobileMax: "767px",
  tabletMin: "768px",
  tabletMax: "1023px",
  desktopMin: "1024px",
};

export default function useResponsiveBreakpoints() {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.mobileMax})`);
  const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.tabletMin}) and (max-width: ${BREAKPOINTS.tabletMax})`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktopMin})`);

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}
