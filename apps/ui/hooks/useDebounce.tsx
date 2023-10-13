import React, { useEffect, useState } from "react";

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const firstDebounce = React.useRef(true);

  useEffect(() => {
    if (value && firstDebounce.current) {
      setDebouncedValue(value);
      firstDebounce.current = false;
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
