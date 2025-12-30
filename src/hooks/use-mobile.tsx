import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const computeIsMobile = React.useCallback(() => {
    if (typeof window === "undefined") return false;

    const landscapeMobile = window.matchMedia(
      "(orientation: landscape) and (max-height: 500px)"
    ).matches;

    return window.innerWidth < MOBILE_BREAKPOINT || landscapeMobile;
  }, []);

  // Initialize state directly
  const [isMobile, setIsMobile] = React.useState<boolean>(() => computeIsMobile());

  // Use ref to track current value without causing re-renders
  const isMobileRef = React.useRef<boolean>(isMobile);

  React.useEffect(() => {
    // Debounce resize handler to prevent rapid state updates during orientation change
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const newIsMobile = computeIsMobile();
        if (isMobileRef.current !== newIsMobile) {
          isMobileRef.current = newIsMobile;
          setIsMobile(newIsMobile);
        }
      }, 100); // Debounce for 100ms to let orientation change settle
    };

    // Listen to resize events which fire during orientation changes
    window.addEventListener("resize", handleResize);

    // Also set initial value correctly
    const initialValue = computeIsMobile();
    if (isMobileRef.current !== initialValue) {
      isMobileRef.current = initialValue;
      setIsMobile(initialValue);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [computeIsMobile]);

  return isMobile;
}
