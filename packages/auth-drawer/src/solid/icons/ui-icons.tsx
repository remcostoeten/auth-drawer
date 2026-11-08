import { LineIcon, type LineIconProps } from "./line-icon";

export function UserRoundIcon(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </LineIcon>
  );
}

export function EyeIcon(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </LineIcon>
  );
}

export function EyeOffIcon(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </LineIcon>
  );
}

export function CheckCircleIcon(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </LineIcon>
  );
}

export function XCircleIcon(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </LineIcon>
  );
}

export function ChevronDownIcon(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </LineIcon>
  );
}

export function CloseIcon(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </LineIcon>
  );
}

export function MailCheckIcon(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      <path d="m16 19 2 2 4-4" />
    </LineIcon>
  );
}

export function KeyRoundIcon(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </LineIcon>
  );
}
