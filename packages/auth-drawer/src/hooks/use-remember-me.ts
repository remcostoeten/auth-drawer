import { useCallback, type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { REMEMBER_KEY } from "../constants";

/**
 * Persists and hydrates the remember-me checkbox state.
 * Versioned storage prevents stale reads after schema changes.
 *
 * @returns Tuple matching the useState boolean contract.
 */
export function useRememberMe(): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [value, setValue] = useState(false);

  useEffect(() => {
    try {
      setValue(localStorage.getItem(REMEMBER_KEY) === "true");
    } catch {
      setValue(false);
    }
  }, []);

  const setRemember = useCallback<Dispatch<SetStateAction<boolean>>>((nextValue) => {
    setValue((current) => {
      const resolved = typeof nextValue === "function" ? nextValue(current) : nextValue;

      try {
        localStorage.setItem(REMEMBER_KEY, String(resolved));
      } catch {
        return resolved;
      }

      return resolved;
    });
  }, []);

  return [value, setRemember];
}
