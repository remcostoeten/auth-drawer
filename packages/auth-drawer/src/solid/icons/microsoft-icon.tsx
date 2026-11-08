type Props = {
  class?: string;
};

export function MicrosoftIcon(props: Props) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      class={props.class}
    >
      <path d="M1 1h10v10H1z" fill="#F25022" />
      <path d="M13 1h10v10H13z" fill="#7FBA00" />
      <path d="M1 13h10v10H1z" fill="#00A4EF" />
      <path d="M13 13h10v10H13z" fill="#FFB900" />
    </svg>
  );
}
