import { useEffect, useRef, useState } from "react";

/**
 * Hook that debounces a value, delaying updates until after the specified delay
 * First value update happens immediately without delay
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds before updating the debounced value
 * @returns Debounced value that updates after the delay period
 * @example
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const firstDebounce = useRef(true);

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
