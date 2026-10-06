import { useEffect, useState } from "react";

/// Hook to get the window height
export function useWindowHeight(): number {
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    function updateSize() {
      setWindowHeight(window.innerHeight);
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return windowHeight;
}
