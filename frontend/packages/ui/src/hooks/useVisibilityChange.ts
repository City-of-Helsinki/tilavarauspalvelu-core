import { useEffect } from "react";

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
