/**
 * AdForge — Debounce Hook
 *
 * Returns a debounced version of the given value that only
 * updates after the specified delay has elapsed without
 * a new value being set.
 */

"use client";

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
