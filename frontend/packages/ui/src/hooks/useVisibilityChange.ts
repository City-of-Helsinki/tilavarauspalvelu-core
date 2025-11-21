import { useEffect } from "react";

/**
 * Hook that executes callbacks when the browser tab visibility changes
 * Uses the Page Visibility API to detect when user switches tabs
 * @param onHidden - Optional callback executed when the tab becomes hidden
 * @param onShow - Optional callback executed when the tab becomes visible
 * @example
 * useVisibilityChange({
 *   onHidden: () => console.log("Tab hidden"),
 *   onShow: () => console.log("Tab visible")
 * });
 */
export function useVisibilityChange({ onHidden, onShow }: { onHidden?: () => void; onShow?: () => void }) {
  useEffect(() => {
    const toggleVisibility = () => {
      if (document.hidden) {
        onHidden?.();
      } else {
        onShow?.();
      }
    };

    document.addEventListener("visibilitychange", toggleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", toggleVisibility);
    };
  }, [onHidden, onShow]);
}
