import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * @name cn
 * @description Joins class names and resolves conflicting Tailwind utilities, the last one wins.
 *
 * @example
 * cn("px-5", isCompact && "px-3"); // "px-3" when compact
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
