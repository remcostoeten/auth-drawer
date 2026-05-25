import type { ReactNode } from "react";

export type PropDef = {
  name: string;
  type: string;
  default?: string;
  description: string;
  defaultPreview?: "default-config";
};

export type SectionProps = {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
};
